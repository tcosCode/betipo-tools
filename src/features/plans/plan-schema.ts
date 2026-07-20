import { z } from "zod";

export const billingCycles = [
  "DIARIO",
  "SEMANAL",
  "MENSUAL",
  "SEMESTRAL",
  "ANUAL",
] as const;

const moneySchema = z
  .string()
  .trim()
  .transform((value) => value.replace(",", "."))
  .pipe(
    z
      .string()
      .regex(
        /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
        "Introduce un importe no negativo con un máximo de dos decimales",
      ),
  );

const nullableLimitSchema = z
  .number({ error: "Introduce un número válido" })
  .int("Debe ser un número entero")
  .min(1, "Debe ser mayor que cero")
  .nullable();

export const planDetailSchema = z
  .object({
    key: z.uuid("Identificador de prestación inválido"),
    text: z
      .string()
      .trim()
      .min(1, "La prestación no puede estar vacía")
      .max(250),
  })
  .strict();

export const planBillingItemSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, "El nombre de la etapa es obligatorio")
      .max(120),
    precioFacturacion: moneySchema,
    cicloFacturacion: z.enum(billingCycles),
    duracion: z
      .number({ error: "Introduce una duración válida" })
      .int("La duración debe ser un número entero")
      .min(1, "La duración debe ser mayor que cero")
      .nullable(),
  })
  .strict();

export const planWriteSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
    usuarios: z
      .number({ error: "Introduce un número de usuarios válido" })
      .int("Los usuarios deben ser un número entero")
      .min(1, "Debe incluir al menos un usuario"),
    valoracionesPlan: nullableLimitSchema,
    captacionesPlan: nullableLimitSchema,
    permiteUsuarioExtra: z.boolean(),
    precioPorUsuarioExtra: moneySchema,
    precioPackValoracionExtra: moneySchema,
    packValoracionExtra: z
      .number({ error: "Introduce un tamaño de pack válido" })
      .int("El tamaño del pack debe ser un número entero")
      .min(0, "El tamaño del pack no puede ser negativo"),
    precio: moneySchema,
    detalles: z
      .array(planDetailSchema)
      .max(20, "Admite como máximo 20 prestaciones"),
    items: z
      .array(planBillingItemSchema)
      .min(1, "El plan debe incluir al menos una etapa de cobro")
      .max(10, "El plan admite como máximo 10 etapas de cobro"),
  })
  .strict()
  .superRefine((plan, context) => {
    const hasPaidAmount =
      Number(plan.precio) > 0 ||
      plan.items.some((item) => Number(item.precioFacturacion) > 0);
    if (!hasPaidAmount) {
      context.addIssue({
        code: "custom",
        path: ["precio"],
        message:
          "Un plan de pago debe tener un precio inicial o una etapa de cobro mayor que cero",
      });
    }

    plan.items.forEach((item, index) => {
      const isLast = index === plan.items.length - 1;
      if (!isLast && item.duracion === null) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "duracion"],
          message: "Las etapas intermedias deben tener una duración",
        });
      }
      if (isLast && item.duracion !== null) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "duracion"],
          message: "La última etapa debe renovarse indefinidamente",
        });
      }
    });
  });

export type PlanWriteInput = z.infer<typeof planWriteSchema>;
export type PlanDetail = z.infer<typeof planDetailSchema>;
export type PlanBillingItemInput = z.infer<typeof planBillingItemSchema>;
export type BillingCycle = (typeof billingCycles)[number];

export interface PlanBillingItem extends PlanBillingItemInput {
  uuid: string;
  indiceItem: number;
}

export interface PlanUsage {
  activeAssignments: number;
  historicalAssignments: number;
  pendingAssignments: number;
  campaignAudiences: number;
  campaignCards: number;
}

export interface PlanAdmin {
  uuid: string;
  nombre: string;
  usuarios: number;
  valoracionesPlan: number | null;
  captacionesPlan: number | null;
  permiteUsuarioExtra: boolean;
  precioPorUsuarioExtra: string;
  precioPackValoracionExtra: string;
  packValoracionExtra: number;
  precio: string;
  esFreemium: boolean;
  detalles: PlanDetail[];
  items: PlanBillingItem[];
  usage: PlanUsage;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}
