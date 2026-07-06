import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { profileUpdateBodySchema } from "@/lib/api-schemas";
import { assertVulnerableApisEnabled } from "@/lib/env";
import { unsafeProfileUpdate } from "@/lib/mass-assignment-service";
import { readJsonBody, validateWithSchema } from "@/lib/request-validation";

export async function PATCH(request: Request) {
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
    profileUpdateBodySchema,
    await readJsonBody(request),
  );

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request body does not match the expected profile update schema.",
      meta,
      validation.issues,
    );
  }

  return apiSuccess(
    {
      warning:
        "This vulnerable Mass Assignment example applies every accepted property directly.",
      profile: unsafeProfileUpdate(validation.value),
    },
    meta,
  );
}
