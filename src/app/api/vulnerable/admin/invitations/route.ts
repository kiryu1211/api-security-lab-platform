import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { adminInvitationBodySchema } from "@/lib/api-schemas";
import { assertVulnerableApisEnabled } from "@/lib/env";
import { unsafeCreateAdminInvitation } from "@/lib/function-authorization-service";
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
    adminInvitationBodySchema,
    await readJsonBody(request),
  );

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request body does not match the expected admin invitation schema.",
      meta,
      validation.issues,
    );
  }

  return apiSuccess(
    {
      warning:
        "This vulnerable function authorization example accepts administrative actions without feature-level permission checks.",
      invitation: unsafeCreateAdminInvitation(validation.value),
    },
    meta,
  );
}
