import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { thirdPartyProfileImportBodySchema } from "@/lib/api-schemas";
import { readJsonBody, validateWithSchema } from "@/lib/request-validation";
import { safeImportThirdPartyProfile } from "@/lib/unsafe-consumption-service";

export async function POST(request: Request) {
  const meta = secureRouteMeta();
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

  const decision = safeImportThirdPartyProfile(validation.value);

  if (!decision.allowed) {
    return apiError(
      403,
      "FORBIDDEN",
      "Third-party API response was rejected by trust-boundary controls.",
      meta,
      decision,
    );
  }

  return apiSuccess(
    {
      authorization: "third-party-response-controls-applied",
      importResult: decision,
    },
    meta,
  );
}
