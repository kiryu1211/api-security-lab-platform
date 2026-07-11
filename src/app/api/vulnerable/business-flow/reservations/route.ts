import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { businessFlowReservationBodySchema } from "@/lib/api-schemas";
import { unsafeReserveSensitiveFlow } from "@/lib/business-flow-service";
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
    businessFlowReservationBodySchema,
    parsedBody.value,
  );

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request body does not match the expected sensitive business flow schema.",
      meta,
      validation.issues,
    );
  }

  return apiSuccess(
    {
      warning:
        "This vulnerable sensitive business flow example accepts excessive automated reservations.",
      reservation: unsafeReserveSensitiveFlow(validation.value),
    },
    meta,
  );
}
