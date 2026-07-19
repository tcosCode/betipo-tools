export const prerender = false;

import type { APIRoute } from "astro";

import { parseCampaignEnvironment } from "../../../lib/campaign-environment";
import { getCampaignPlanOptions } from "../../../lib/campaigns";
import { getDb } from "../../../lib/db";
import { json } from "../../../lib/http";

export const GET: APIRoute = async ({ url, locals }) => {
  const { userId } = locals.auth();
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const environment = parseCampaignEnvironment(url);
  if (!environment.success)
    return json({ error: environment.error }, environment.status);

  try {
    return json(await getCampaignPlanOptions(getDb(environment.env)));
  } catch (error) {
    console.error("Error fetching campaign plan options:", error);
    return json({ error: "Error fetching campaign plan options" }, 500);
  }
};
