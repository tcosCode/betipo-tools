import type postgres from "postgres";

import {
  planModalTemplateSchema,
  type CampaignAdmin,
  type CampaignWriteInput,
  type PlanModalTemplate,
  type PlanOption,
} from "../features/campaigns/campaign-schema";
import { formatPlanPrice } from "../features/campaigns/campaign-defaults";

type Sql = postgres.Sql;
type TransactionSql = postgres.TransactionSql;

interface CampaignDbRow {
  uuid: string;
  nombre: string;
  ui_template: PlanModalTemplate;
  ids_planes_aplicables: string[];
  created_at: Date | string;
  updated_at: Date | string | null;
  deleted_at: Date | string | null;
}

interface PlanDbRow {
  uuid: string;
  nombre: string;
  precio: string;
  es_freemium: boolean;
}

export class CampaignDataError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "CampaignDataError";
  }
}

const toIsoString = (value: Date | string | null): string | null => {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
    ? value
    : `${value}Z`;
  return new Date(normalized).toISOString();
};

const mapCampaign = (row: CampaignDbRow): CampaignAdmin => ({
  uuid: row.uuid,
  nombre: row.nombre,
  uiTemplate: planModalTemplateSchema.parse(row.ui_template),
  idsPlanesAplicables: row.ids_planes_aplicables,
  createdAt: toIsoString(row.created_at)!,
  updatedAt: toIsoString(row.updated_at),
  deletedAt: toIsoString(row.deleted_at),
});

const mapPlan = (row: PlanDbRow): PlanOption => ({
  uuid: row.uuid,
  nombre: row.nombre,
  precio: row.precio,
  esFreemium: row.es_freemium,
});

const validateNameAndAudience = async (
  tx: TransactionSql,
  campaign: CampaignWriteInput,
  currentUuid?: string,
) => {
  const duplicateNames = currentUuid
    ? await tx<{ uuid: string }[]>`
        SELECT uuid
        FROM public.campannas
        WHERE deleted_at IS NULL
          AND lower(nombre) = lower(${campaign.nombre})
          AND uuid <> ${currentUuid}::uuid
      `
    : await tx<{ uuid: string }[]>`
        SELECT uuid
        FROM public.campannas
        WHERE deleted_at IS NULL
          AND lower(nombre) = lower(${campaign.nombre})
      `;

  if (duplicateNames.length > 0) {
    throw new CampaignDataError(
      "Ya existe una campaña activa con ese nombre",
      409,
      "DUPLICATE_NAME",
    );
  }

  if (campaign.idsPlanesAplicables.length === 0) {
    const fallbacks = currentUuid
      ? await tx<{ uuid: string; nombre: string }[]>`
          SELECT uuid, nombre
          FROM public.campannas
          WHERE deleted_at IS NULL
            AND cardinality(ids_planes_aplicables) = 0
            AND uuid <> ${currentUuid}::uuid
        `
      : await tx<{ uuid: string; nombre: string }[]>`
          SELECT uuid, nombre
          FROM public.campannas
          WHERE deleted_at IS NULL
            AND cardinality(ids_planes_aplicables) = 0
        `;

    if (fallbacks.length > 0) {
      throw new CampaignDataError(
        "Ya existe una campaña fallback",
        409,
        "FALLBACK_ALREADY_EXISTS",
        fallbacks,
      );
    }
    return;
  }

  const overlaps = currentUuid
    ? await tx<{ uuid: string; nombre: string }[]>`
        SELECT uuid, nombre
        FROM public.campannas
        WHERE deleted_at IS NULL
          AND cardinality(ids_planes_aplicables) > 0
          AND ids_planes_aplicables && ${campaign.idsPlanesAplicables}::uuid[]
          AND uuid <> ${currentUuid}::uuid
      `
    : await tx<{ uuid: string; nombre: string }[]>`
        SELECT uuid, nombre
        FROM public.campannas
        WHERE deleted_at IS NULL
          AND cardinality(ids_planes_aplicables) > 0
          AND ids_planes_aplicables && ${campaign.idsPlanesAplicables}::uuid[]
      `;

  if (overlaps.length > 0) {
    throw new CampaignDataError(
      "La audiencia se solapa con otra campaña activa",
      409,
      "AUDIENCE_OVERLAP",
      overlaps,
    );
  }
};

const prepareTemplate = async (
  tx: TransactionSql,
  campaign: CampaignWriteInput,
  existingAudience: string[] = [],
) => {
  const targetPlanUuids = campaign.uiTemplate.cards.map(
    (card) => card.planUuid,
  );
  // Existing orphaned audience UUIDs remain round-trippable so unrelated edits do not
  // brick legacy campaigns. New audience references and every destination plan must exist.
  const newAudienceUuids = campaign.idsPlanesAplicables.filter(
    (planUuid) => !existingAudience.includes(planUuid),
  );
  const planUuidsToValidate = [
    ...new Set([...targetPlanUuids, ...newAudienceUuids]),
  ];

  const plans = await tx<PlanDbRow[]>`
    SELECT uuid, nombre, precio::text AS precio, es_freemium
    FROM public.planes
    WHERE deleted_at IS NULL
      AND uuid = ANY(${planUuidsToValidate}::uuid[])
  `;
  const plansByUuid = new Map(plans.map((plan) => [plan.uuid, plan]));
  const missingUuids = planUuidsToValidate.filter(
    (uuid) => !plansByUuid.has(uuid),
  );

  if (missingUuids.length > 0) {
    throw new CampaignDataError(
      "La campaña contiene planes que no existen",
      400,
      "UNKNOWN_PLANS",
      missingUuids,
    );
  }

  return {
    ...campaign.uiTemplate,
    cards: campaign.uiTemplate.cards.map((card) => ({
      ...card,
      price: { text: formatPlanPrice(plansByUuid.get(card.planUuid)!.precio) },
    })),
  };
};

export const getCampaigns = async (sql: Sql): Promise<CampaignAdmin[]> => {
  const rows = await sql<CampaignDbRow[]>`
    SELECT uuid, nombre, ui_template, ids_planes_aplicables,
      created_at, updated_at, deleted_at
    FROM public.campannas
    WHERE deleted_at IS NULL
    ORDER BY nombre, uuid
  `;
  return rows.map(mapCampaign);
};

export const getCampaignPlanOptions = async (
  sql: Sql,
): Promise<PlanOption[]> => {
  const rows = await sql<PlanDbRow[]>`
    SELECT uuid, nombre, precio::text AS precio, es_freemium
    FROM public.planes
    WHERE deleted_at IS NULL
    ORDER BY lower(nombre), precio, uuid
  `;
  return rows.map(mapPlan);
};

export const createCampaign = async (
  sql: Sql,
  campaign: CampaignWriteInput,
): Promise<CampaignAdmin> =>
  sql.begin(async (tx) => {
    await tx.unsafe("LOCK TABLE public.campannas IN SHARE ROW EXCLUSIVE MODE");
    await validateNameAndAudience(tx, campaign);
    const uiTemplate = await prepareTemplate(tx, campaign);
    const rows = await tx<CampaignDbRow[]>`
      INSERT INTO public.campannas (nombre, ui_template, ids_planes_aplicables)
      VALUES (
        ${campaign.nombre},
        ${tx.json(uiTemplate)},
        ${campaign.idsPlanesAplicables}::uuid[]
      )
      RETURNING uuid, nombre, ui_template, ids_planes_aplicables,
        created_at, updated_at, deleted_at
    `;
    return mapCampaign(rows[0]);
  });

export const updateCampaign = async (
  sql: Sql,
  uuid: string,
  campaign: CampaignWriteInput,
): Promise<CampaignAdmin> =>
  sql.begin(async (tx) => {
    await tx.unsafe("LOCK TABLE public.campannas IN SHARE ROW EXCLUSIVE MODE");
    const existingRows = await tx<CampaignDbRow[]>`
      SELECT uuid, nombre, ui_template, ids_planes_aplicables,
        created_at, updated_at, deleted_at
      FROM public.campannas
      WHERE uuid = ${uuid}::uuid
        AND deleted_at IS NULL
      FOR UPDATE
    `;
    const existing = existingRows[0];
    if (!existing) {
      throw new CampaignDataError(
        "Campaña no encontrada",
        404,
        "CAMPAIGN_NOT_FOUND",
      );
    }

    const expectedUpdatedAt = campaign.expectedUpdatedAt ?? null;
    if (toIsoString(existing.updated_at) !== expectedUpdatedAt) {
      throw new CampaignDataError(
        "La campaña ha sido modificada por otro usuario",
        409,
        "CAMPAIGN_CHANGED",
      );
    }

    await validateNameAndAudience(tx, campaign, uuid);
    const uiTemplate = await prepareTemplate(
      tx,
      campaign,
      existing.ids_planes_aplicables,
    );
    const rows = await tx<CampaignDbRow[]>`
      UPDATE public.campannas
      SET nombre = ${campaign.nombre},
          ui_template = ${tx.json(uiTemplate)},
          ids_planes_aplicables = ${campaign.idsPlanesAplicables}::uuid[],
          updated_at = CURRENT_TIMESTAMP
      WHERE uuid = ${uuid}::uuid
      RETURNING uuid, nombre, ui_template, ids_planes_aplicables,
        created_at, updated_at, deleted_at
    `;
    return mapCampaign(rows[0]);
  });

export const archiveCampaign = async (
  sql: Sql,
  uuid: string,
): Promise<void> => {
  const rows = await sql<{ uuid: string }[]>`
    UPDATE public.campannas
    SET deleted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE uuid = ${uuid}::uuid
      AND deleted_at IS NULL
    RETURNING uuid
  `;

  if (rows.length === 0) {
    throw new CampaignDataError(
      "Campaña no encontrada",
      404,
      "CAMPAIGN_NOT_FOUND",
    );
  }
};
