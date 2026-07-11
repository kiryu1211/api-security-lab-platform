import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { businessFlowReservationBodySchema } from "@/lib/api-schemas";
import { safeReserveSensitiveFlow } from "@/lib/business-flow-service";
import { parseJsonRequest, validateWithSchema } from "@/lib/request-validation";

export async function POST(request: Request) {
  const meta = secureRouteMeta();
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
