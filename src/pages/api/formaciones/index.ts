export const prerender = false;

import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db";
import { formationInputSchema } from "../../../lib/validation";
import { dbDateToUtc } from "../../../utils/dates";

export const GET: APIRoute = async ({ url }) => {
  const env = (url.searchParams.get("env") as "dev" | "prod") || "dev";
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

    return new Response(JSON.stringify(formations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching formations:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching formations" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const POST: APIRoute = async ({ request, url }) => {
  const env = (url.searchParams.get("env") as "dev" | "prod") || "dev";
  const sql = getDb(env);

  try {
    const data = formationInputSchema.safeParse(await request.json());
    if (!data.success) {
      return new Response(JSON.stringify({ error: "Invalid formation data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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

    return new Response(JSON.stringify(formation), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating formation:", error);
    return new Response(JSON.stringify({ error: "Error creating formation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
