import { getResponseError } from "../../utils/errors";
import type {
  CampaignAdmin,
  CampaignWriteInput,
  PlanOption,
} from "./campaign-schema";

const CAMPAIGN_API = "/api/campannas?env=dev";

export const fetchCampaigns = async (
  signal?: AbortSignal,
): Promise<CampaignAdmin[]> => {
  const response = await fetch(CAMPAIGN_API, { signal });
  if (!response.ok)
    throw new Error(
      await getResponseError(response, "Error al cargar campañas"),
    );
  return response.json();
};

export const fetchCampaignPlanOptions = async (
  signal?: AbortSignal,
): Promise<PlanOption[]> => {
  const response = await fetch("/api/campannas/planes?env=dev", { signal });
  if (!response.ok)
    throw new Error(await getResponseError(response, "Error al cargar planes"));
  return response.json();
};

export const saveCampaign = async (
  input: CampaignWriteInput,
  uuid?: string,
): Promise<CampaignAdmin> => {
  const response = await fetch(
    uuid ? `/api/campannas/${uuid}?env=dev` : CAMPAIGN_API,
    {
      method: uuid ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok)
    throw new Error(
      await getResponseError(response, "Error al guardar campaña"),
    );
  return response.json();
};

export const archiveCampaign = async (uuid: string): Promise<void> => {
  const response = await fetch(`/api/campannas/${uuid}?env=dev`, {
    method: "DELETE",
  });
  if (!response.ok)
    throw new Error(
      await getResponseError(response, "Error al eliminar campaña"),
    );
};
