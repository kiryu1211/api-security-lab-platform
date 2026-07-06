import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { rateLimitQuerySchema } from "@/lib/api-schemas";
import { assertVulnerableApisEnabled } from "@/lib/env";
import {
  searchParamsToObject,
  validateWithSchema,
} from "@/lib/request-validation";
import { unsafeSearch } from "@/lib/rate-limit-service";

export function GET(request: Request) {
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

  const url = new URL(request.url);
  const validation = validateWithSchema(
    rateLimitQuerySchema,
    searchParamsToObject(url.searchParams),
  );

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request query does not match the expected rate limit demo schema.",
      meta,
      validation.issues,
    );
  }

  return apiSuccess(
    {
      warning:
        "This vulnerable rate-limit example intentionally performs no request limiting.",
      result: unsafeSearch(validation.value.userId, validation.value.q),
    },
    meta,
  );
}
