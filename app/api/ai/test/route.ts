import { generateText, MetaAIError } from "@/lib/ai/meta-client";

const PROMPT = "Explain Umbreon to someone who is new to Pokémon in two sentences.";

/** Development-only smoke test for the Meta Model API connection. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await generateText(PROMPT);
    return Response.json({ prompt: PROMPT, ...result });
  } catch (err) {
    if (err instanceof MetaAIError) {
      return Response.json({ error: err.message, code: err.code }, { status: err.status });
    }
    return Response.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
