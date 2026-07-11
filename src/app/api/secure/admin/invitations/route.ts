import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { adminInvitationBodySchema } from "@/lib/api-schemas";
import { safeCreateAdminInvitation } from "@/lib/function-authorization-service";
import { parseJsonRequest, validateWithSchema } from "@/lib/request-validation";

export async function POST(request: Request) {
  const meta = secureRouteMeta();
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

  const decision = safeCreateAdminInvitation(validation.value);

  if (!decision.allowed) {
    return apiError(
      403,
      "FORBIDDEN",
      "Administrative function request was rejected by feature-level authorization.",
      meta,
      decision,
    );
  }

  return apiSuccess(
    {
      authorization: decision.authorization,
      invitation: decision.invitation,
    },
    meta,
  );
}
