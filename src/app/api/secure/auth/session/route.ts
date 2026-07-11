import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { authSessionBodySchema } from "@/lib/api-schemas";
import {
  authFailureStatus,
  createVerifiedSession,
  toSessionResponse,
} from "@/lib/auth-token-service";
import { parseJsonRequest, validateWithSchema } from "@/lib/request-validation";

export async function POST(request: Request) {
  const meta = secureRouteMeta();
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

  const result = createVerifiedSession(
    validation.value.tokenId,
    validation.value.requiredPermission,
  );

  if (!result.ok) {
    const status = authFailureStatus(result.reason);
    return apiError(
      status,
      status === 403
        ? "FORBIDDEN"
        : status === 404
          ? "NOT_FOUND"
          : "UNAUTHORIZED",
      "The demo token failed secure validation.",
      meta,
      { reason: result.reason },
    );
  }

  return apiSuccess(
    {
      authorization: "token-verified",
      ...toSessionResponse(result),
    },
    meta,
  );
}
