import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { authSessionBodySchema } from "@/lib/api-schemas";
import { createWeakSession, toSessionResponse } from "@/lib/auth-token-service";
import { assertVulnerableApisEnabled } from "@/lib/env";
import { readJsonBody, validateWithSchema } from "@/lib/request-validation";

export async function POST(request: Request) {
  const meta = vulnerableRouteMeta();
  const guard = assertVulnerableApisEnabled();

  if (!guard.ok) {
    return apiError(
      guard.status,
      "VULNERABLE_API_DISABLED",
      guard.message,
      meta,
      guard.safety,
    );
  }

  const validation = validateWithSchema(
    authSessionBodySchema,
    await readJsonBody(request),
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
