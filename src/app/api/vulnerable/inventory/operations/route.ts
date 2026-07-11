import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { apiInventoryOperationBodySchema } from "@/lib/api-schemas";
import { unsafeInvokeInventoryOperation } from "@/lib/api-inventory-service";
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
    apiInventoryOperationBodySchema,
    parsedBody.value,
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

  return apiSuccess(
    {
      warning:
        "This vulnerable inventory example invokes a legacy API operation without lifecycle or exposure checks.",
      operation: unsafeInvokeInventoryOperation(validation.value),
    },
    meta,
  );
}
