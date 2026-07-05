import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { orderPathParamsSchema } from "@/lib/api-schemas";
import { getOrderByIdOnly, toOrderResponse } from "@/lib/bola-service";
import { assertVulnerableApisEnabled } from "@/lib/env";
import { validateWithSchema } from "@/lib/request-validation";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
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
    orderPathParamsSchema,
    await context.params,
  );

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Path parameter does not match the expected local demo order schema.",
      meta,
      validation.issues,
    );
  }

  const result = getOrderByIdOnly(validation.value.orderId);

  if (!result.ok) {
    return apiError(
      404,
      "NOT_FOUND",
      "The requested local demo order was not found.",
      meta,
    );
  }

  return apiSuccess(
    {
      warning:
        "This vulnerable BOLA example fetches by order ID only and intentionally skips ownership checks.",
      ...toOrderResponse(result),
    },
    meta,
  );
}
