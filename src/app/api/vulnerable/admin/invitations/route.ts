import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { adminInvitationBodySchema } from "@/lib/api-schemas";
import { assertVulnerableApisEnabled } from "@/lib/env";
import { unsafeCreateAdminInvitation } from "@/lib/function-authorization-service";
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
    adminInvitationBodySchema,
    parsedBody.value,
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
