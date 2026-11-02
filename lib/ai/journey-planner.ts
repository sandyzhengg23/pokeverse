/** Server-side journey planner: builds spoiler-safe context, asks Muse Spark, validates the answer. */
import type { JourneyPlan, JourneyRequest } from "./contracts";
import {
  assemblePlan,
  buildPrompt,
  getCandidates,
  JourneyPlanError,
  parseModelPlanReply,
} from "./journey";
import { generateText } from "./meta-client";

export async function planJourney(req: JourneyRequest): Promise<JourneyPlan> {
  const candidates = getCandidates(req.pokemonIds);
  const reply = await generateText(buildPrompt(req, candidates), {
    timeoutMs: 45_000,
    maxOutputTokens: 4000,
  });

  const parsed = parseModelPlanReply(reply.text);
  if (!parsed) throw new JourneyPlanError("The model's answer couldn't be understood.", "invalid_reply");
  return assemblePlan(req, candidates, parsed, reply.model);
}
