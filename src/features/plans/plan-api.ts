import { getResponseError } from "../../utils/errors";
import type { PlanAdmin, PlanWriteInput } from "./plan-schema";

const PLANS_API = "/api/planes?env=dev";

export const fetchPlans = async (
  signal?: AbortSignal,
): Promise<PlanAdmin[]> => {
  const response = await fetch(PLANS_API, { signal });
  if (!response.ok) {
    throw new Error(await getResponseError(response, "Error al cargar planes"));
  }
  return response.json();
};

export const createPlan = async (input: PlanWriteInput): Promise<PlanAdmin> => {
  const response = await fetch(PLANS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await getResponseError(response, "Error al crear el plan"));
  }
  return response.json();
};
