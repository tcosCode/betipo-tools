export const prerender = false;

import type { APIRoute } from "astro";

import { planWriteSchema } from "../../../features/plans/plan-schema";
import { getDb } from "../../../lib/db";
import { json } from "../../../lib/http";
import { parsePlanEnvironment } from "../../../lib/plan-environment";
import { createPlan, getPlans, PlanDataError } from "../../../lib/plans";

export const GET: APIRoute = async ({ url, locals }) => {
  const { userId } = locals.auth();
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const environment = parsePlanEnvironment(url);
  if (!environment.success) {
    return json({ error: environment.error }, environment.status);
  }

  try {
    return json(await getPlans(getDb(environment.env)));
  } catch (error) {
    console.error("Error fetching plans:", error);
    return json({ error: "Error fetching plans" }, 500);
  }
};

export const POST: APIRoute = async ({ request, url, locals }) => {
  const { userId } = locals.auth();
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const environment = parsePlanEnvironment(url);
  if (!environment.success) {
    return json({ error: environment.error }, environment.status);
  }

  try {
    const input = planWriteSchema.safeParse(await request.json());
    if (!input.success) {
      return json(
        { error: "Invalid plan data", issues: input.error.issues },
        400,
      );
    }
    return json(await createPlan(getDb(environment.env), input.data), 201);
  } catch (error) {
    if (error instanceof PlanDataError) {
      return json(
        { error: error.message, code: error.code, details: error.details },
        error.status,
      );
    }
    if (error instanceof SyntaxError) {
      return json({ error: "Invalid JSON body" }, 400);
    }
    console.error("Error creating plan:", error);
    return json({ error: "Error creating plan" }, 500);
  }
};
