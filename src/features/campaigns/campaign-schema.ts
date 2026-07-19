import { z } from "zod";

const hexColorSchema = z
  .string()
  .regex(
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
    "Color hexadecimal inválido",
  );

const requireVisibleText = (
  value: { visibility: boolean; text: string },
  context: z.RefinementCtx,
) => {
  if (value.visibility && !value.text.trim()) {
    context.addIssue({
      code: "custom",
      path: ["text"],
      message: "El texto es obligatorio cuando el elemento está visible",
    });
  }
};

const displayTextSchema = z.string().trim().max(250);

const visibilityTextSchema = z
  .object({
    visibility: z.boolean(),
    text: displayTextSchema,
  })
  .strict()
  .superRefine(requireVisibleText);

const chipSchema = visibilityTextSchema;

const itemSchema = z
  .object({
    text: z
      .string()
      .trim()
      .min(1, "El texto de la prestación es obligatorio")
      .max(250),
    itemChip: chipSchema,
  })
  .strict();

const cardSchema = z
  .object({
    highlighted: z.boolean(),
    planUuid: z.uuid("Selecciona un plan válido"),
    chip: chipSchema,
    planTitle: z.object({ text: z.string().trim().min(1).max(120) }).strict(),
    planSubtitle: visibilityTextSchema,
    priceDiscount: visibilityTextSchema,
    price: z.object({ text: z.string().trim().max(50) }).strict(),
    priceSubtitle: z
      .object({ text: z.string().trim().min(1).max(120) })
      .strict(),
    helperIconText: z
      .object({
        visibility: z.boolean(),
        text: displayTextSchema,
        textColor: hexColorSchema.optional(),
      })
      .strict()
      .superRefine(requireVisibleText),
    helperText: visibilityTextSchema,
    items: z
      .object({
        visibility: z.boolean(),
        itemsArray: z
          .array(itemSchema)
          .max(5, "Una tarjeta admite como máximo 5 prestaciones"),
      })
      .strict()
      .superRefine((items, context) => {
        if (items.visibility && items.itemsArray.length === 0) {
          context.addIssue({
            code: "custom",
            path: ["itemsArray"],
            message:
              "Añade al menos una prestación cuando la lista está visible",
          });
        }
      }),
    buttonText: z.object({ text: z.string().trim().min(1).max(80) }).strict(),
    footnotes: z
      .array(z.object({ text: z.string().trim().min(1).max(300) }).strict())
      .max(2, "Una tarjeta admite como máximo 2 notas adicionales"),
  })
  .strict();

const cardsSchema = z
  .array(cardSchema)
  .length(3, "Cada campaña debe ofrecer exactamente 3 planes")
  .superRefine((cards, context) => {
    const planUuids = cards.map((card) => card.planUuid);
    if (new Set(planUuids).size !== planUuids.length) {
      context.addIssue({
        code: "custom",
        message: "Los tres planes ofrecidos deben ser distintos",
      });
    }

    if (cards.filter((card) => card.highlighted).length > 1) {
      context.addIssue({
        code: "custom",
        message: "Solo puede haber un plan destacado",
      });
    }
  });

export const planModalTemplateSchema = z
  .object({
    generalData: z
      .object({
        showOnLogin: z.boolean(),
        primaryColor: hexColorSchema,
        secondaryColor: hexColorSchema,
      })
      .strict(),
    header: z
      .object({
        banner: z
          .object({
            visibility: z.boolean(),
            bgColor: hexColorSchema.optional(),
            primaryText: displayTextSchema,
            primaryTextColor: hexColorSchema.optional(),
            secondaryText: z
              .object({
                visibility: z.boolean(),
                text: displayTextSchema,
                color: hexColorSchema.optional(),
              })
              .strict()
              .superRefine(requireVisibleText),
            bannerChip: z
              .object({
                visibility: z.boolean(),
                text: displayTextSchema,
                bgColor: hexColorSchema.optional(),
                textColor: hexColorSchema.optional(),
              })
              .strict()
              .superRefine(requireVisibleText),
          })
          .strict()
          .superRefine((banner, context) => {
            if (banner.visibility && !banner.primaryText.trim()) {
              context.addIssue({
                code: "custom",
                path: ["primaryText"],
                message:
                  "El texto principal es obligatorio cuando el banner está visible",
              });
            }
          }),
        auxiliaryText: visibilityTextSchema,
      })
      .strict(),
    cards: cardsSchema,
    footer: z
      .object({
        footerColumns: z
          .array(
            z
              .object({
                title: z.string().trim().min(1).max(120),
                chip: chipSchema,
                columnItems: z
                  .array(
                    z
                      .object({ text: z.string().trim().min(1).max(250) })
                      .strict(),
                  )
                  .min(1, "Cada columna debe incluir al menos una prestación")
                  .max(3, "Una columna admite como máximo 3 prestaciones"),
              })
              .strict(),
          )
          .min(2, "El footer debe incluir al menos 2 columnas")
          .max(4, "El footer admite como máximo 4 columnas"),
      })
      .strict(),
  })
  .strict();

export const campaignWriteSchema = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
    uiTemplate: planModalTemplateSchema,
    idsPlanesAplicables: z.array(z.uuid()).max(200),
    expectedUpdatedAt: z.iso.datetime().nullable().optional(),
  })
  .strict()
  .superRefine((campaign, context) => {
    if (
      new Set(campaign.idsPlanesAplicables).size !==
      campaign.idsPlanesAplicables.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["idsPlanesAplicables"],
        message: "La audiencia no puede contener planes duplicados",
      });
    }
  });

export const campaignUuidSchema = z.uuid();

export type PlanModalTemplate = z.infer<typeof planModalTemplateSchema>;
export type CampaignWriteInput = z.infer<typeof campaignWriteSchema>;

export interface CampaignAdmin extends Omit<
  CampaignWriteInput,
  "expectedUpdatedAt"
> {
  uuid: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface PlanOption {
  uuid: string;
  nombre: string;
  precio: string;
  esFreemium: boolean;
}
