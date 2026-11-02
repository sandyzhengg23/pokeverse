import { MAX_UPLOAD_BYTES, sniffImageType } from "@/lib/ai/card-scan";
import { scanCard } from "@/lib/ai/card-scanner";
import { MetaAIError } from "@/lib/ai/meta-client";
import { limitAiRequest, tooManyRequests } from "@/lib/rate-limit";

/**
 * POST /api/scan — multipart form with one `image` field.
 * The image is validated, held in memory for the Muse Spark call, and never written to disk.
 */
export async function POST(request: Request) {
  // Cheap early reject so oversized bodies aren't buffered at all.
  const declared = Number(request.headers.get("content-length"));
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) {
    return fail("That image is too large. Please use one under 5 MB.", 413);
  }

  // Rate-limit before buffering or parsing the upload.
  const limit = await limitAiRequest(request, { name: "scan", max: 10, windowSeconds: 600 });
  if (!limit.ok) return tooManyRequests(limit, "You’ve scanned a lot of cards. Please wait a few minutes and try again.");

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("image");
  } catch {
    return fail("Please upload an image file.", 400);
  }
  if (!(file instanceof File) || file.size === 0) return fail("Please upload an image file.", 400);
  if (file.size > MAX_UPLOAD_BYTES) return fail("That image is too large. Please use one under 5 MB.", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = sniffImageType(bytes);
  if (!mimeType) return fail("Unsupported file. Please upload a JPEG, PNG, WebP or GIF image.", 415);

  try {
    return Response.json(await scanCard({ mimeType, bytes }));
  } catch (err) {
    if (err instanceof MetaAIError) {
      const message =
        err.code === "timeout"
          ? "The scan took too long. Please try again."
          : err.code === "missing_key"
            ? "The scanner isn't configured on the server."
            : "We couldn't read that card right now. Please try again.";
      return fail(message, err.status);
    }
    // Name + message only: never the request, which contains the image.
    console.error("[scan] unexpected error:", err instanceof Error ? `${err.name}: ${err.message}` : "unknown");
    return fail("Something went wrong while scanning.", 500);
  }
}

function fail(error: string, status: number) {
  return Response.json({ error }, { status });
}
