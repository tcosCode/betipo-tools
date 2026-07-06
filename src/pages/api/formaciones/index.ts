export const prerender = false;

import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db";
import { parseEnv } from "../../../lib/env";
import { json } from "../../../lib/http";
import { formationInputSchema } from "../../../lib/validation";
import { dbDateToUtc } from "../../../utils/dates";

export const GET: APIRoute = async ({ url, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return json({ error: "Unauthorized" }, 401);
  }

  const env = parseEnv(url);
  if (!env) {
    return json({ error: "Invalid environment" }, 400);
  }

  const sql = getDb(env);

  try {
    const rawFormations = await sql`
      SELECT 
        id, asunto, entidad, descripcion, enlace, oculta,
        fecha_inicio::text as fecha_inicio,
        fecha_fin::text as fecha_fin
      FROM formaciones 
      ORDER BY fecha_inicio DESC
    `;

    const formations = rawFormations.map((f) => ({
      ...f,
      fecha_inicio: dbDateToUtc(f.fecha_inicio),
      fecha_fin: dbDateToUtc(f.fecha_fin),
    }));

    return json(formations);
  } catch (error) {
    console.error("Error fetching formations:", error);
    return json({ error: "Error fetching formations" }, 500);
  }
};

export const POST: APIRoute = async ({ request, url, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return json({ error: "Unauthorized" }, 401);
  }

  const env = parseEnv(url);
  if (!env) {
    return json({ error: "Invalid environment" }, 400);
  }

  const sql = getDb(env);

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
      INSERT INTO formaciones (asunto, entidad, descripcion, fecha_inicio, fecha_fin, enlace, oculta)
      VALUES (${asunto}, ${entidad}, ${descripcion}, ${fecha_inicio}, ${fecha_fin}, ${enlace}, ${oculta})
      RETURNING id, asunto, entidad, descripcion, enlace, oculta,
        fecha_inicio::text as fecha_inicio,
        fecha_fin::text as fecha_fin
    `;

    const formation = {
      ...result[0],
      fecha_inicio: dbDateToUtc(result[0].fecha_inicio),
      fecha_fin: dbDateToUtc(result[0].fecha_fin),
    };

    return json(formation, 201);
  } catch (error) {
    console.error("Error creating formation:", error);
    return json({ error: "Error creating formation" }, 500);
  }
};
