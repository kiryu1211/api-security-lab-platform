import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { profileUpdateBodySchema } from "@/lib/api-schemas";
import { safeProfileUpdate } from "@/lib/mass-assignment-service";
import { parseJsonRequest, validateWithSchema } from "@/lib/request-validation";

export async function PATCH(request: Request) {
  const meta = secureRouteMeta();
  const parsedBody = await parseJsonRequest(request, meta);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const validation = validateWithSchema(
    profileUpdateBodySchema,
    parsedBody.value,
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

  const rejectedProperties = Object.keys(
    parsedBody.value as Record<string, unknown>,
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
