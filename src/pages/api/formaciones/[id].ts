export const prerender = false;

import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db";
import { formationInputSchema } from "../../../lib/validation";
import { dbDateToUtc } from "../../../utils/dates";

export const PUT: APIRoute = async ({ request, params, url }) => {
  const id = params.id;
  const env = (url.searchParams.get("env") as "dev" | "prod") || "dev";
  const sql = getDb(env);

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing ID" }), {
      status: 400,
    });
  }

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
      return new Response(JSON.stringify({ error: "Formation not found" }), {
        status: 404,
      });
    }

    const formation = {
      ...result[0],
      fecha_inicio: dbDateToUtc(result[0].fecha_inicio),
      fecha_fin: dbDateToUtc(result[0].fecha_fin),
    };

    return new Response(JSON.stringify(formation), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating formation:", error);
    return new Response(JSON.stringify({ error: "Error updating formation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, url }) => {
  const id = params.id;
  const env = (url.searchParams.get("env") as "dev" | "prod") || "dev";
  const sql = getDb(env);

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing ID" }), {
      status: 400,
    });
  }

  try {
    const result = await sql`
      DELETE FROM formaciones
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return new Response(JSON.stringify({ error: "Formation not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ message: "Deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting formation:", error);
    return new Response(JSON.stringify({ error: "Error deleting formation" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
