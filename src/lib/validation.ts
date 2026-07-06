import { z } from "astro/zod";

export const formationInputSchema = z.object({
  asunto: z.string().trim().min(1),
  entidad: z.string().trim().min(1),
  descripcion: z.string(),
  fecha_inicio: z.string().trim().min(1),
  fecha_fin: z.string().trim().min(1),
  enlace: z.string(),
  oculta: z.boolean(),
});

export const maintenanceInputSchema = z.object({
  en_mantenimiento: z.boolean(),
});
