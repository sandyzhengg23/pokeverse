import { JourneyPlanError, parseJourneyRequest } from "@/lib/ai/journey";
import { planJourney } from "@/lib/ai/journey-planner";
import { isMetaConfigured, MetaAIError } from "@/lib/ai/meta-client";
import { blockedResponse, DAILY_LIMIT_MESSAGE, limitPerIp, reserveAiCall } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 2048;

/** POST /api/journey — plans a spoiler-safe viewing journey from the curated dataset. */
export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length"));
  if (declared > MAX_BODY_BYTES) return fail("Request is too large.", 413);

  // Per-visitor limit before any parsing or AI work.
  const perIp = await limitPerIp(request, { name: "journey", max: 10, windowSeconds: 600 });
  if (!perIp.ok) {
    return blockedResponse(perIp, { perIp: "You’ve built a lot of journeys. Please wait a few minutes and try again." });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return fail("Request is too large.", 413);
    body = JSON.parse(text);
  } catch {
    return fail("Request body must be valid JSON.", 400);
  }

  const parsed = parseJourneyRequest(body);
  if (!parsed.ok) return fail(parsed.error, 400);

  if (!isMetaConfigured()) return fail("The journey planner isn't configured on the server.", 500);

  // App-wide daily Meta budget, consumed only now that the request is valid and about to call Meta.
  const daily = await reserveAiCall();
  if (!daily.ok) return blockedResponse(daily, { daily: DAILY_LIMIT_MESSAGE });

  try {
    return Response.json(await planJourney(parsed.value));
  } catch (err) {
    if (err instanceof MetaAIError) {
      const message =
        err.code === "timeout"
          ? "Planning took too long. Please try again."
          : err.code === "missing_key"
            ? "The journey planner isn't configured on the server."
            : "We couldn't plan your journey right now. Please try again.";
      return fail(message, err.status);
    }
    if (err instanceof JourneyPlanError) {
      return fail("The planner returned an unusable answer. Please try again.", 502);
    }
    // Name + message only: never the request or the model's output.
    console.error("[journey] unexpected error:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown");
    return fail("Something went wrong while planning your journey.", 500);
  }
}

function fail(error: string, status: number) {
  return Response.json({ error }, { status });
}
