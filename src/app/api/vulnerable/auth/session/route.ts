import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { authSessionBodySchema } from "@/lib/api-schemas";
import { createWeakSession, toSessionResponse } from "@/lib/auth-token-service";
import { assertVulnerableApisEnabled } from "@/lib/env";
import { parseJsonRequest, validateWithSchema } from "@/lib/request-validation";

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

  const validation = validateWithSchema(
    authSessionBodySchema,
    parsedBody.value,
  );

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request body does not match the expected demo token schema.",
      meta,
      validation.issues,
    );
  }

  const result = createWeakSession(validation.value.tokenId);

  if (!result.ok) {
    return apiError(
      404,
      "NOT_FOUND",
      "The requested local demo token was not found.",
      meta,
    );
  }

  return apiSuccess(
    {
      warning:
        "This vulnerable authentication example accepts token identity without validating signature, expiration, revocation, or permission.",
      ...toSessionResponse(result),
    },
    meta,
  );
}
