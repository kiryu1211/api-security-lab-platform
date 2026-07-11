import { apiError, type ApiMeta } from "./api-response";
import { z } from "zod";

export const MAX_JSON_BODY_BYTES = 16 * 1024;

type JsonRequestResult =
  { ok: true; value: unknown } | { ok: false; response: Response };

export type ValidationResult<TValue> =
  { ok: true; value: TValue } | { ok: false; issues: z.ZodIssue[] };

export function validateWithSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
): ValidationResult<z.infer<TSchema>> {
  const result = schema.safeParse(value);

  if (!result.success) {
    return { ok: false, issues: result.error.issues };
  }

  return { ok: true, value: result.data };
}

export function searchParamsToObject(searchParams: URLSearchParams) {
  const values: Record<string, string | string[]> = {};

  for (const [key, value] of searchParams) {
    const current = values[key];
    values[key] = current
      ? Array.isArray(current)
        ? [...current, value]
        : [current, value]
      : value;
  }

  return values;
}

function isJsonContentType(contentType: string | null) {
  if (!contentType) {
    return false;
  }

  return /^application\/json(?:\s*;\s*charset\s*=\s*(?:"utf-8"|utf-8))?\s*$/i.test(
    contentType,
  );
}

export async function parseJsonRequest(
  request: Request,
  meta: ApiMeta,
): Promise<JsonRequestResult> {
  if (!isJsonContentType(request.headers.get("content-type"))) {
    return {
      ok: false,
      response: apiError(
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "Content-Type must be application/json with an optional charset parameter.",
        meta,
      ),
    };
  }

  const declaredLength = request.headers.get("content-length")?.trim();
  if (
    declaredLength &&
    /^\d+$/.test(declaredLength) &&
    BigInt(declaredLength) > BigInt(MAX_JSON_BODY_BYTES)
  ) {
    return {
      ok: false,
      response: apiError(
        413,
        "PAYLOAD_TOO_LARGE",
        "JSON request body must not exceed 16 KiB.",
        meta,
      ),
    };
  }

  if (!request.body) {
    return {
      ok: false,
      response: apiError(
        400,
        "INVALID_JSON",
        "Request body must contain valid JSON.",
        meta,
      ),
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let actualLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      actualLength += value.byteLength;
      if (actualLength > MAX_JSON_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The 413 response remains authoritative if stream cancellation fails.
        }

        return {
          ok: false,
          response: apiError(
            413,
            "PAYLOAD_TOO_LARGE",
            "JSON request body must not exceed 16 KiB.",
            meta,
          ),
        };
      }

      chunks.push(value);
    }
  } catch {
    return {
      ok: false,
      response: apiError(
        400,
        "INVALID_JSON",
        "Request body must contain valid JSON.",
        meta,
      ),
    };
  } finally {
    reader.releaseLock();
  }

  const bodyBytes = new Uint8Array(actualLength);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const body = new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes);
    return { ok: true, value: JSON.parse(body) as unknown };
  } catch {
    return {
      ok: false,
      response: apiError(
        400,
        "INVALID_JSON",
        "Request body must contain valid JSON.",
        meta,
      ),
    };
  }
}
