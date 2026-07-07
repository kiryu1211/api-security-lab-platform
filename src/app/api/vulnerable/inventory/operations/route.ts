import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { apiInventoryOperationBodySchema } from "@/lib/api-schemas";
import { unsafeInvokeInventoryOperation } from "@/lib/api-inventory-service";
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

  return apiSuccess(
    {
      warning:
        "This vulnerable inventory example invokes a legacy API operation without lifecycle or exposure checks.",
      operation: unsafeInvokeInventoryOperation(validation.value),
    },
    meta,
  );
}
