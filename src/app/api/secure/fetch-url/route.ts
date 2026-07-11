import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { fetchUrlBodySchema } from "@/lib/api-schemas";
import { parseJsonRequest, validateWithSchema } from "@/lib/request-validation";
import { safeFetchPreview } from "@/lib/ssrf-service";

export async function POST(request: Request) {
  const meta = secureRouteMeta();
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

  const decision = safeFetchPreview(validation.value.url);

  if (!decision.allowed) {
    return apiError(
      403,
      "FORBIDDEN",
      "The requested URL is not allowed by the SSRF protection policy.",
      meta,
      decision,
    );
  }

  return apiSuccess(
    { protection: "allowlist-applied", preview: decision },
    meta,
  );
}
