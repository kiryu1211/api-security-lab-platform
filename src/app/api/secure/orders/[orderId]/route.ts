import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import {
  orderPathParamsSchema,
  secureOrderQuerySchema,
} from "@/lib/api-schemas";
import {
  getOrderWithOwnershipCheck,
  toOrderResponse,
} from "@/lib/bola-service";
import {
  searchParamsToObject,
  validateWithSchema,
} from "@/lib/request-validation";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const meta = secureRouteMeta();
  const pathValidation = validateWithSchema(
    orderPathParamsSchema,
    await context.params,
  );

  if (!pathValidation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Path parameter does not match the expected local demo order schema.",
      meta,
      pathValidation.issues,
    );
  }

  const url = new URL(request.url);
  const queryValidation = validateWithSchema(
    secureOrderQuerySchema,
    searchParamsToObject(url.searchParams),
  );

  if (!queryValidation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Query parameter does not match the expected local demo user schema.",
      meta,
      queryValidation.issues,
    );
  }

  const result = getOrderWithOwnershipCheck(
    pathValidation.value.orderId,
    queryValidation.value.userId,
  );

  if (!result.ok) {
    if (result.reason === "forbidden") {
      return apiError(
        403,
        "FORBIDDEN",
        "The authenticated demo user does not own the requested order.",
        meta,
      );
    }

    return apiError(
      404,
      "NOT_FOUND",
      "The requested local demo order was not found.",
      meta,
    );
  }

  return apiSuccess(
    {
      authorization: "owner-verified",
      ...toOrderResponse(result),
    },
    meta,
  );
}
