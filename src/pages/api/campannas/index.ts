export const prerender = false;

import type { APIRoute } from "astro";

import { campaignWriteSchema } from "../../../features/campaigns/campaign-schema";
import { parseCampaignEnvironment } from "../../../lib/campaign-environment";
import {
  CampaignDataError,
  createCampaign,
  getCampaigns,
} from "../../../lib/campaigns";
import { getDb } from "../../../lib/db";
import { json } from "../../../lib/http";

export const GET: APIRoute = async ({ url, locals }) => {
  const { userId } = locals.auth();
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const environment = parseCampaignEnvironment(url);
  if (!environment.success)
    return json({ error: environment.error }, environment.status);

  try {
    return json(await getCampaigns(getDb(environment.env)));
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return json({ error: "Error fetching campaigns" }, 500);
  }
};

export const POST: APIRoute = async ({ request, url, locals }) => {
  const { userId } = locals.auth();
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const environment = parseCampaignEnvironment(url);
  if (!environment.success)
    return json({ error: environment.error }, environment.status);

  try {
    const input = campaignWriteSchema.safeParse(await request.json());
    if (!input.success) {
      return json(
        { error: "Invalid campaign data", issues: input.error.issues },
        400,
      );
    }

    const campaign = await createCampaign(getDb(environment.env), input.data);
    return json(campaign, 201);
  } catch (error) {
    if (error instanceof CampaignDataError) {
      return json(
        { error: error.message, code: error.code, details: error.details },
        error.status,
      );
    }
    if (error instanceof SyntaxError) {
      return json({ error: "Invalid JSON body" }, 400);
    }
    console.error("Error creating campaign:", error);
    return json({ error: "Error creating campaign" }, 500);
  }
};
