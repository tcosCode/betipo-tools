import type postgres from "postgres";

import type {
  BillingCycle,
  PlanAdmin,
  PlanBillingItem,
  PlanDetail,
  PlanWriteInput,
} from "../features/plans/plan-schema";

type Sql = postgres.Sql;

interface PlanItemDbRow {
  uuid: string;
  nombre: string;
  indiceItem: number;
  precioFacturacion: string;
  cicloFacturacion: BillingCycle;
  duracion: number | null;
}

interface PlanDbRow {
  uuid: string;
  nombre: string;
  usuarios: number;
  valoraciones_plan: number | null;
  captaciones_plan: number | null;
  permite_usuario_extra: boolean;
  precio_usuario_extra: string;
  precio_pack_valoracion_extra: string;
  pack_valoracion_extra: number;
  detalles: unknown;
  precio: string;
  es_freemium: boolean;
  created_at: Date | string;
  updated_at: Date | string | null;
  deleted_at: Date | string | null;
  items: PlanItemDbRow[];
  active_assignments: number;
  historical_assignments: number;
  pending_assignments: number;
  campaign_audiences: number;
  campaign_cards: number;
}

export class PlanDataError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "PlanDataError";
  }
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const toIsoString = (value: Date | string | null): string | null => {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
    ? value
    : `${value}Z`;
  return new Date(normalized).toISOString();
};

const parseDetails = (rawDetails: unknown): PlanDetail[] => {
  let details = rawDetails;
  if (typeof details === "string") {
    try {
      details = JSON.parse(details);
    } catch {
      return [];
    }
  }

  const result: PlanDetail[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    Object.entries(value).forEach(([key, text]) => {
      if (UUID_PATTERN.test(key) && typeof text === "string") {
        result.push({ key, text });
      } else {
        visit(text);
      }
    });
  };
  visit(details);
  return result;
};

const mapPlan = (row: PlanDbRow): PlanAdmin => ({
  uuid: row.uuid,
  nombre: row.nombre,
  usuarios: row.usuarios,
  valoracionesPlan: row.valoraciones_plan,
  captacionesPlan: row.captaciones_plan,
  permiteUsuarioExtra: row.permite_usuario_extra,
  precioPorUsuarioExtra: row.precio_usuario_extra,
  precioPackValoracionExtra: row.precio_pack_valoracion_extra,
  packValoracionExtra: row.pack_valoracion_extra,
  precio: row.precio,
  esFreemium: row.es_freemium,
  detalles: parseDetails(row.detalles),
  items: row.items,
  usage: {
    activeAssignments: row.active_assignments,
    historicalAssignments: row.historical_assignments,
    pendingAssignments: row.pending_assignments,
    campaignAudiences: row.campaign_audiences,
    campaignCards: row.campaign_cards,
  },
  createdAt: toIsoString(row.created_at)!,
  updatedAt: toIsoString(row.updated_at),
  deletedAt: toIsoString(row.deleted_at),
});

export const getPlans = async (sql: Sql): Promise<PlanAdmin[]> => {
  const rows = await sql<PlanDbRow[]>`
    SELECT p.uuid, p.nombre, p.usuarios, p.valoraciones_plan, p.captaciones_plan,
      p.permite_usuario_extra, p.precio_usuario_extra::text,
      p.precio_pack_valoracion_extra::text, p.pack_valoracion_extra,
      p.detalles, p.precio::text, p.es_freemium,
      p.created_at, p.updated_at, p.deleted_at,
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'uuid', pi.uuid,
            'nombre', pi.nombre,
            'indiceItem', pi.indice_item,
            'precioFacturacion', pi.precio_facturacion::text,
            'cicloFacturacion', pi.ciclo_facturacion,
            'duracion', pi.duracion
          ) ORDER BY pi.indice_item
        )
        FROM public.plan_items pi
        WHERE pi.plan_uuid = p.uuid
      ), '[]'::jsonb) AS items,
      (SELECT count(DISTINCT assigned.inmobiliaria_uuid)::int
        FROM public.planes_inmobiliaria assigned
        WHERE assigned.plan_uuid = p.uuid AND assigned.habilitado) AS active_assignments,
      (SELECT count(*)::int FROM public.planes_inmobiliaria assigned
        WHERE assigned.plan_uuid = p.uuid AND NOT assigned.habilitado) AS historical_assignments,
      (SELECT count(DISTINCT pending.inmobiliaria_uuid)::int
        FROM public.planes_inmobiliaria pending
        WHERE pending.plan_pendiente_uuid = p.uuid) AS pending_assignments,
      (SELECT count(*)::int FROM public.campannas campaign
        WHERE campaign.deleted_at IS NULL
          AND p.uuid = ANY(campaign.ids_planes_aplicables)) AS campaign_audiences,
      (SELECT count(DISTINCT campaign.uuid)::int
        FROM public.campannas campaign
        CROSS JOIN LATERAL jsonb_array_elements(
          COALESCE(campaign.ui_template->'cards', '[]'::jsonb)
        ) card
        WHERE campaign.deleted_at IS NULL
          AND card->>'planUuid' = p.uuid::text) AS campaign_cards
    FROM public.planes p
    WHERE p.deleted_at IS NULL
    ORDER BY p.es_freemium DESC, lower(p.nombre), p.precio, p.uuid
  `;
  return rows.map(mapPlan);
};

const serializeDetails = (details: PlanDetail[]) =>
  JSON.stringify(details.map((detail) => ({ [detail.key]: detail.text })));

export const createPlan = async (
  sql: Sql,
  input: PlanWriteInput,
): Promise<PlanAdmin> =>
  sql.begin(async (tx) => {
    await tx.unsafe("LOCK TABLE public.planes IN SHARE ROW EXCLUSIVE MODE");
    const duplicates = await tx<{ uuid: string }[]>`
      SELECT uuid
      FROM public.planes
      WHERE deleted_at IS NULL
        AND lower(nombre) = lower(${input.nombre})
    `;
    if (duplicates.length > 0) {
      throw new PlanDataError(
        "Ya existe un plan activo con ese nombre",
        409,
        "DUPLICATE_NAME",
      );
    }

    const insertedPlans = await tx<PlanDbRow[]>`
      INSERT INTO public.planes (
        nombre, usuarios, valoraciones_plan, captaciones_plan,
        permite_usuario_extra, precio_usuario_extra,
        precio_pack_valoracion_extra, pack_valoracion_extra,
        detalles, precio, es_freemium
      ) VALUES (
        ${input.nombre},
        ${input.usuarios},
        ${input.valoracionesPlan},
        ${input.captacionesPlan},
        ${input.permiteUsuarioExtra},
        ${input.precioPorUsuarioExtra}::numeric,
        ${input.precioPackValoracionExtra}::numeric,
        ${input.packValoracionExtra},
        ${serializeDetails(input.detalles)},
        ${input.precio}::numeric,
        false
      )
      RETURNING uuid, nombre, usuarios, valoraciones_plan, captaciones_plan,
        permite_usuario_extra, precio_usuario_extra::text,
        precio_pack_valoracion_extra::text, pack_valoracion_extra,
        detalles, precio::text, es_freemium,
        created_at, updated_at, deleted_at
    `;
    const plan = insertedPlans[0];
    const items: PlanBillingItem[] = [];

    for (const [index, item] of input.items.entries()) {
      const insertedItems = await tx<PlanItemDbRow[]>`
        INSERT INTO public.plan_items (
          nombre, indice_item, precio_facturacion,
          ciclo_facturacion, duracion, plan_uuid
        ) VALUES (
          ${item.nombre},
          ${index + 1},
          ${item.precioFacturacion}::numeric,
          ${item.cicloFacturacion}::public.plan_items_ciclo_facturacion_enum,
          ${item.duracion},
          ${plan.uuid}::uuid
        )
        RETURNING uuid, nombre, indice_item AS "indiceItem",
          precio_facturacion::text AS "precioFacturacion",
          ciclo_facturacion AS "cicloFacturacion", duracion
      `;
      items.push(insertedItems[0]);
    }

    return mapPlan({
      ...plan,
      items,
      active_assignments: 0,
      historical_assignments: 0,
      pending_assignments: 0,
      campaign_audiences: 0,
      campaign_cards: 0,
    });
  });
