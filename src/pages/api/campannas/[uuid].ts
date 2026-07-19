export const prerender = false;

import type { APIRoute } from "astro";

import {
  campaignUuidSchema,
  campaignWriteSchema,
} from "../../../features/campaigns/campaign-schema";
import { parseCampaignEnvironment } from "../../../lib/campaign-environment";
import { CampaignDataError, updateCampaign } from "../../../lib/campaigns";
import { getDb } from "../../../lib/db";
import { json } from "../../../lib/http";

export const PUT: APIRoute = async ({ request, params, url, locals }) => {
  const { userId } = locals.auth();
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const environment = parseCampaignEnvironment(url);
  if (!environment.success)
    return json({ error: environment.error }, environment.status);

  const uuid = campaignUuidSchema.safeParse(params.uuid);
  if (!uuid.success) return json({ error: "Invalid campaign UUID" }, 400);

  try {
    const input = campaignWriteSchema.safeParse(await request.json());
    if (!input.success) {
      return json(
        { error: "Invalid campaign data", issues: input.error.issues },
        400,
      );
    }

    return json(
      await updateCampaign(getDb(environment.env), uuid.data, input.data),
    );
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
    console.error("Error updating campaign:", error);
    return json({ error: "Error updating campaign" }, 500);
  }
};
