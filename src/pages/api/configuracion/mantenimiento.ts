export const prerender = false;

import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db";
import { maintenanceInputSchema } from "../../../lib/validation";

export const GET: APIRoute = async ({ url }) => {
  const env = (url.searchParams.get("env") as "dev" | "prod") || "dev";
  const sql = getDb(env);

  try {
    const result = await sql`
      SELECT en_mantenimiento
      FROM configuracion 
      LIMIT 1
    `;

    // Si no hay fila en la tabla configuración, asumimos false.
    const en_mantenimiento =
      result.length > 0 ? result[0].en_mantenimiento === true : false;

    return new Response(JSON.stringify({ en_mantenimiento }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching configuracion:", error);
    return new Response(
      JSON.stringify({ error: "Error fetch configuration" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  const env = (url.searchParams.get("env") as "dev" | "prod") || "dev";
  const sql = getDb(env);

  try {
    const data = maintenanceInputSchema.safeParse(await request.json());
    if (!data.success) {
      return new Response(
        JSON.stringify({ error: "Invalid maintenance data" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { en_mantenimiento } = data.data;

    // Primero verificamos si hay algún registro
    const countResult = await sql`SELECT count(*) FROM configuracion`;

    let result;
    if (parseInt(countResult[0].count) === 0) {
      // Si la tabla está vacía, insertamos
      result = await sql`
        INSERT INTO configuracion (en_mantenimiento)
        VALUES (${en_mantenimiento})
        RETURNING en_mantenimiento
      `;
    } else {
      // Actualizamos todos los registros (normalmente solo debería haber uno)
      result = await sql`
        UPDATE configuracion 
        SET en_mantenimiento = ${en_mantenimiento}
        RETURNING en_mantenimiento
      `;
    }

    return new Response(
      JSON.stringify({ en_mantenimiento: result[0].en_mantenimiento }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error updating configuracion:", error);
    return new Response(
      JSON.stringify({ error: "Error updating configuration" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
