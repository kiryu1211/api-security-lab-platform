import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { apiInventoryOperationBodySchema } from "@/lib/api-schemas";
import { safeInvokeInventoryOperation } from "@/lib/api-inventory-service";
import { readJsonBody, validateWithSchema } from "@/lib/request-validation";

export async function POST(request: Request) {
  const meta = secureRouteMeta();
  const validation = validateWithSchema(
    apiInventoryOperationBodySchema,
    await readJsonBody(request),
  );

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request body does not match the expected API inventory operation schema.",
      meta,
      validation.issues,
    );
  }

  const decision = safeInvokeInventoryOperation(validation.value);

  if (!decision.allowed) {
    return apiError(
      403,
      "FORBIDDEN",
      "API operation was rejected by inventory and lifecycle controls.",
      meta,
      decision,
    );
  }

  return apiSuccess(
    {
      authorization: "api-inventory-controls-applied",
      operation: decision,
    },
    meta,
  );
}
