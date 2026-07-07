import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { businessFlowReservationBodySchema } from "@/lib/api-schemas";
import { unsafeReserveSensitiveFlow } from "@/lib/business-flow-service";
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
    businessFlowReservationBodySchema,
    await readJsonBody(request),
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
