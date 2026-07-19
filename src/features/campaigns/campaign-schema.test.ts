import { describe, expect, it } from "vitest";

import { createCampaignDefaults } from "./campaign-defaults";
import {
  campaignWriteSchema,
  type CampaignWriteInput,
} from "./campaign-schema";

const PLAN_UUIDS = [
  "964c8e63-99b4-49eb-9feb-717b0179f13e",
  "a50857f5-53b5-4159-a0b7-37fc7d325dc8",
  "7ceee427-40d5-42b6-b0b3-011c4eb59487",
] as const;

const createValidCampaign = (): CampaignWriteInput => {
  const campaign = createCampaignDefaults();
  campaign.nombre = "Campaña de prueba";
  campaign.idsPlanesAplicables = ["90d04551-158c-44ab-adf6-8f4766a48889"];
  campaign.uiTemplate.cards.forEach((card, index) => {
    card.planUuid = PLAN_UUIDS[index];
  });
  return campaign;
};

describe("campaignWriteSchema", () => {
  it("acepta una campaña específica con tres planes distintos", () => {
    expect(campaignWriteSchema.safeParse(createValidCampaign()).success).toBe(
      true,
    );
  });

  it("acepta una campaña fallback con audiencia vacía", () => {
    const campaign = createValidCampaign();
    campaign.idsPlanesAplicables = [];

    expect(campaignWriteSchema.safeParse(campaign).success).toBe(true);
  });

  it("rechaza planes destino duplicados", () => {
    const campaign = createValidCampaign();
    campaign.uiTemplate.cards[2].planUuid =
      campaign.uiTemplate.cards[0].planUuid;

    const result = campaignWriteSchema.safeParse(campaign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("deben ser distintos"),
        ),
      ).toBe(true);
    }
  });

  it("rechaza más de una tarjeta destacada", () => {
    const campaign = createValidCampaign();
    campaign.uiTemplate.cards[0].highlighted = true;
    campaign.uiTemplate.cards[1].highlighted = true;

    const result = campaignWriteSchema.safeParse(campaign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) =>
          issue.message.includes("Solo puede haber un"),
        ),
      ).toBe(true);
    }
  });

  it("aplica los límites de prestaciones y notas", () => {
    const campaign = createValidCampaign();
    campaign.uiTemplate.cards[0].items.itemsArray = Array.from(
      { length: 6 },
      (_, index) => ({
        text: `Prestación ${index}`,
        itemChip: { visibility: false, text: "" },
      }),
    );
    campaign.uiTemplate.cards[0].footnotes = [
      { text: "Nota 1" },
      { text: "Nota 2" },
      { text: "Nota 3" },
    ];

    const result = campaignWriteSchema.safeParse(campaign);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toHaveLength(2);
  });

  it("exige texto cuando un elemento está visible", () => {
    const campaign = createValidCampaign();
    campaign.uiTemplate.cards[0].helperText = { visibility: true, text: "" };

    const result = campaignWriteSchema.safeParse(campaign);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual([
        "uiTemplate",
        "cards",
        0,
        "helperText",
        "text",
      ]);
    }
  });

  it("rechaza propiedades desconocidas del JSON", () => {
    const campaign = createValidCampaign() as CampaignWriteInput & {
      unexpected?: boolean;
    };
    campaign.unexpected = true;

    expect(campaignWriteSchema.safeParse(campaign).success).toBe(false);
  });
});
