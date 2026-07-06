import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { profileUpdateBodySchema } from "@/lib/api-schemas";
import { safeProfileUpdate } from "@/lib/mass-assignment-service";
import { readJsonBody, validateWithSchema } from "@/lib/request-validation";

export async function PATCH(request: Request) {
  const meta = secureRouteMeta();
  const validation = validateWithSchema(
    profileUpdateBodySchema,
    await readJsonBody(request),
  );

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request body does not match the expected profile update schema.",
      meta,
      validation.issues,
    );
  }

  return apiSuccess(
    {
      authorization: "allowlist-applied",
      profile: safeProfileUpdate(validation.value),
    },
    meta,
  );
}
