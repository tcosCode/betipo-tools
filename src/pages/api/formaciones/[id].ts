export const prerender = false;

import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db";
import { json } from "../../../lib/http";
import { formationInputSchema } from "../../../lib/validation";
import { dbDateToUtc } from "../../../utils/dates";

export const PUT: APIRoute = async ({ request, params, url }) => {
  const id = params.id;
  const env = (url.searchParams.get("env") as "dev" | "prod") || "dev";
  const sql = getDb(env);

  if (!id) {
    return json({ error: "Missing ID" }, 400);
  }

  try {
    const data = formationInputSchema.safeParse(await request.json());
    if (!data.success) {
      return json({ error: "Invalid formation data" }, 400);
    }

    const {
      asunto,
      entidad,
      descripcion,
      fecha_inicio,
      fecha_fin,
      enlace,
      oculta,
    } = data.data;

    const result = await sql`
      UPDATE formaciones
      SET asunto = ${asunto},
          entidad = ${entidad},
          descripcion = ${descripcion},
          fecha_inicio = ${fecha_inicio},
          fecha_fin = ${fecha_fin},
          enlace = ${enlace},
          oculta = ${oculta}
      WHERE id = ${id}
      RETURNING id, asunto, entidad, descripcion, enlace, oculta,
        fecha_inicio::text as fecha_inicio,
        fecha_fin::text as fecha_fin
    `;

    if (result.length === 0) {
      return json({ error: "Formation not found" }, 404);
    }

    const formation = {
      ...result[0],
      fecha_inicio: dbDateToUtc(result[0].fecha_inicio),
      fecha_fin: dbDateToUtc(result[0].fecha_fin),
    };

    return json(formation);
  } catch (error) {
    console.error("Error updating formation:", error);
    return json({ error: "Error updating formation" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params, url }) => {
  const id = params.id;
  const env = (url.searchParams.get("env") as "dev" | "prod") || "dev";
  const sql = getDb(env);

  if (!id) {
    return json({ error: "Missing ID" }, 400);
  }

  try {
    const result = await sql`
      DELETE FROM formaciones
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return json({ error: "Formation not found" }, 404);
    }

    return json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting formation:", error);
    return json({ error: "Error deleting formation" }, 500);
  }
};
