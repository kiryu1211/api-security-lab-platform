import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { fetchUrlBodySchema } from "@/lib/api-schemas";
import { assertVulnerableApisEnabled } from "@/lib/env";
import { parseJsonRequest, validateWithSchema } from "@/lib/request-validation";
import { unsafeFetchPreview } from "@/lib/ssrf-service";

export async function POST(request: Request) {
  const meta = vulnerableRouteMeta();
  const guard = assertVulnerableApisEnabled(request);

  if (!guard.ok) {
    return apiError(
      guard.status,
      "VULNERABLE_API_DISABLED",
      guard.message,
      meta,
      guard.safety,
    );
  }

  const parsedBody = await parseJsonRequest(request, meta);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const validation = validateWithSchema(fetchUrlBodySchema, parsedBody.value);

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request body does not match the expected URL fetch schema.",
      meta,
      validation.issues,
    );
  }

  return apiSuccess(
    {
      warning:
        "This vulnerable SSRF example accepts arbitrary URLs, but the lab does not perform real outbound network access.",
      preview: unsafeFetchPreview(validation.value.url),
    },
    meta,
  );
}
