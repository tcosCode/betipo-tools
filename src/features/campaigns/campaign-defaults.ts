import type { CampaignWriteInput, PlanModalTemplate } from "./campaign-schema";

const createEmptyCard = (
  index: number,
): PlanModalTemplate["cards"][number] => ({
  highlighted: index === 1,
  planUuid: "",
  chip: { visibility: index === 1, text: index === 1 ? "PLAN DESTACADO" : "" },
  planTitle: { text: `Plan ${index + 1}` },
  planSubtitle: { visibility: false, text: "" },
  priceDiscount: { visibility: false, text: "" },
  price: { text: "0" },
  priceSubtitle: { text: "Precio del plan seleccionado" },
  helperIconText: { visibility: false, text: "" },
  helperText: { visibility: false, text: "" },
  items: { visibility: false, itemsArray: [] },
  buttonText: { text: "Elegir este plan" },
  footnotes: [],
});

export const createCampaignDefaults = (): CampaignWriteInput => ({
  nombre: "",
  idsPlanesAplicables: [],
  expectedUpdatedAt: null,
  uiTemplate: {
    generalData: {
      showOnLogin: false,
      primaryColor: "#FFC107",
      secondaryColor: "#0D0D10",
    },
    header: {
      banner: {
        visibility: true,
        bgColor: "#FFC107",
        primaryText: "Por tiempo limitado",
        primaryTextColor: "#0D0D10",
        secondaryText: {
          visibility: true,
          text: "OFERTA ESPECIAL",
          color: "#0D0D10",
        },
        bannerChip: {
          visibility: true,
          text: "NUEVA CAMPAÑA",
          bgColor: "#0D0D10",
          textColor: "#FFC107",
        },
      },
      auxiliaryText: { visibility: false, text: "" },
    },
    cards: [createEmptyCard(0), createEmptyCard(1), createEmptyCard(2)],
    footer: { footerColumns: [] },
  },
});

export const campaignToFormValues = (campaign: {
  nombre: string;
  idsPlanesAplicables: string[];
  uiTemplate: PlanModalTemplate;
  updatedAt: string | null;
}): CampaignWriteInput => ({
  nombre: campaign.nombre,
  idsPlanesAplicables: campaign.idsPlanesAplicables,
  uiTemplate: campaign.uiTemplate,
  expectedUpdatedAt: campaign.updatedAt,
});
