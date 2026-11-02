/**
 * Server-side Meta Model API client (Muse Spark).
 *
 * Meta exposes an OpenAI-compatible Responses API, so we use the `openai` SDK
 * pointed at Meta's base URL. The key is read from MODEL_API_KEY (no
 * NEXT_PUBLIC_ prefix) and must only be imported from server code
 * (Route Handlers, Server Components).
 */
import OpenAI from "openai";

export const META_BASE_URL = "https://api.meta.ai/v1";
export const MUSE_SPARK_MODEL = "muse-spark-1.3";
const TIMEOUT_MS = 30_000;

export class MetaAIError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: "missing_key" | "timeout" | "api_error" | "empty_response",
  ) {
    super(message);
    this.name = "MetaAIError";
  }
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey) {
    throw new MetaAIError("MODEL_API_KEY is not configured on the server.", 500, "missing_key");
  }
  client ??= new OpenAI({ apiKey, baseURL: META_BASE_URL, timeout: TIMEOUT_MS, maxRetries: 1 });
  return client;
}

export interface MetaTextResult {
  text: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number } | null;
}

interface RequestOptions {
  timeoutMs?: number;
  maxOutputTokens?: number;
}

async function respond(
  input: OpenAI.Responses.ResponseCreateParamsNonStreaming["input"],
  { timeoutMs, maxOutputTokens }: RequestOptions = {},
): Promise<MetaTextResult> {
  try {
    const response = await getClient().responses.create(
      {
        model: MUSE_SPARK_MODEL,
        input,
        reasoning: { effort: "low" },
        ...(maxOutputTokens ? { max_output_tokens: maxOutputTokens } : {}),
      },
      timeoutMs ? { timeout: timeoutMs } : undefined,
    );
    const text = response.output_text?.trim();
    if (!text) throw new MetaAIError("Model returned no text.", 502, "empty_response");
    return {
      text,
      model: response.model,
      usage: response.usage
        ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens }
        : null,
    };
  } catch (err) {
    if (err instanceof MetaAIError) throw err;
    if (err instanceof OpenAI.APIConnectionTimeoutError) {
      throw new MetaAIError("Meta Model API timed out.", 504, "timeout");
    }
    // Only surface the HTTP status — never the raw error, which may echo request details.
    const status = err instanceof OpenAI.APIError && err.status ? err.status : 502;
    throw new MetaAIError(`Meta Model API request failed (status ${status}).`, 502, "api_error");
  }
}

/** Send a plain text prompt to Muse Spark and return its text answer. */
export function generateText(prompt: string, options?: RequestOptions): Promise<MetaTextResult> {
  return respond(prompt, options);
}

/**
 * Send a prompt plus one image (as a base64 data URL, per Meta's
 * image-understanding docs) to Muse Spark and return its text answer.
 * The image is only held in memory for the duration of the request.
 */
export function generateTextFromImage(
  prompt: string,
  image: { mimeType: string; bytes: Uint8Array },
  options?: RequestOptions,
): Promise<MetaTextResult> {
  const dataUrl = `data:${image.mimeType};base64,${Buffer.from(image.bytes).toString("base64")}`;
  return respond(
    [
      {
        type: "message",
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: dataUrl, detail: "auto" },
        ],
      },
    ],
    options,
  );
}
