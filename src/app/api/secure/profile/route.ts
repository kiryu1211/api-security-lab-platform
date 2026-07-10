import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { profileUpdateBodySchema } from "@/lib/api-schemas";
import { safeProfileUpdate } from "@/lib/mass-assignment-service";
import { readJsonBody, validateWithSchema } from "@/lib/request-validation";

export async function PATCH(request: Request) {
  const meta = secureRouteMeta();
  const body = await readJsonBody(request);
  const validation = validateWithSchema(profileUpdateBodySchema, body);

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request body does not match the expected profile update schema.",
      meta,
      validation.issues,
    );
  }

  const rejectedProperties = Object.keys(
    body as Record<string, unknown>,
  ).filter((key) => key !== "displayLabel" && key !== "notificationsEnabled");

  if (rejectedProperties.length > 0) {
    return apiError(
      403,
      "FORBIDDEN",
      "Profile update contains properties that are not allowed for normal user updates.",
      meta,
      {
        rejectedProperties,
        allowedProperties: ["displayLabel", "notificationsEnabled"],
      },
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
