export const prerender = false;

import type { APIRoute } from "astro";
import { getDb } from "../../../lib/db";
import { parseEnv } from "../../../lib/env";
import { json } from "../../../lib/http";
import { maintenanceInputSchema } from "../../../lib/validation";

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
    const result = await sql`
      SELECT en_mantenimiento
      FROM configuracion 
      LIMIT 1
    `;

    // Si no hay fila en la tabla configuración, asumimos false.
    const en_mantenimiento =
      result.length > 0 ? result[0].en_mantenimiento === true : false;

    return json({ en_mantenimiento });
  } catch (error) {
    console.error("Error fetching configuracion:", error);
    return json({ error: "Error fetch configuration" }, 500);
  }
};

export const PUT: APIRoute = async ({ request, url, locals }) => {
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
    const data = maintenanceInputSchema.safeParse(await request.json());
    if (!data.success) {
      return json({ error: "Invalid maintenance data" }, 400);
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

    return json({ en_mantenimiento: result[0].en_mantenimiento });
  } catch (error) {
    console.error("Error updating configuracion:", error);
    return json({ error: "Error updating configuration" }, 500);
  }
};
