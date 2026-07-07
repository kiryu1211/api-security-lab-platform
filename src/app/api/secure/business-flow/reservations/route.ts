import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { businessFlowReservationBodySchema } from "@/lib/api-schemas";
import { safeReserveSensitiveFlow } from "@/lib/business-flow-service";
import { readJsonBody, validateWithSchema } from "@/lib/request-validation";

export async function POST(request: Request) {
  const meta = secureRouteMeta();
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

  const decision = safeReserveSensitiveFlow(validation.value);

  if (!decision.allowed) {
    return apiError(
      403,
      "FORBIDDEN",
      "Sensitive business flow request was rejected by flow and abuse controls.",
      meta,
      decision,
    );
  }

  return apiSuccess(
    {
      authorization: "business-flow-controls-applied",
      reservation: decision.reservation,
    },
    meta,
  );
}
