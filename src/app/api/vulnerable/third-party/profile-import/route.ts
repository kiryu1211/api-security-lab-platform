import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { thirdPartyProfileImportBodySchema } from "@/lib/api-schemas";
import { assertVulnerableApisEnabled } from "@/lib/env";
import { readJsonBody, validateWithSchema } from "@/lib/request-validation";
import { unsafeImportThirdPartyProfile } from "@/lib/unsafe-consumption-service";

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
    thirdPartyProfileImportBodySchema,
    await readJsonBody(request),
  );

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request body does not match the expected third-party profile import schema.",
      meta,
      validation.issues,
    );
  }

  return apiSuccess(
    {
      warning:
        "This vulnerable Unsafe Consumption example trusts synthetic partner API data without validation.",
      importResult: unsafeImportThirdPartyProfile(validation.value),
    },
    meta,
  );
}
