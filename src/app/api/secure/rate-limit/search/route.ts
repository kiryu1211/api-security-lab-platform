import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { rateLimitQuerySchema } from "@/lib/api-schemas";
import {
  searchParamsToObject,
  validateWithSchema,
} from "@/lib/request-validation";
import { checkRateLimit, unsafeSearch } from "@/lib/rate-limit-service";

function rateLimitHeaders(
  decision: ReturnType<typeof checkRateLimit>,
  includeRetryAfter = false,
) {
  const resetInSeconds = Math.max(1, Math.ceil(decision.resetInMs / 1000));
  const headers = new Headers({
    "RateLimit-Limit": String(decision.limit),
    "RateLimit-Remaining": String(decision.remaining),
    "RateLimit-Reset": String(resetInSeconds),
  });

  if (includeRetryAfter) {
    headers.set("Retry-After", String(resetInSeconds));
  }

  return headers;
}

export function GET(request: Request) {
  const meta = secureRouteMeta();
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

  const decision = checkRateLimit(
    validation.value.userId,
    "/api/secure/rate-limit/search",
  );

  if (!decision.allowed) {
    return apiError(
      429,
      "RATE_LIMITED",
      "The demo rate limit has been exceeded.",
      meta,
      decision,
      { headers: rateLimitHeaders(decision, true) },
    );
  }

  return apiSuccess(
    {
      rateLimit: decision,
      result: {
        ...unsafeSearch(validation.value.userId, validation.value.q),
        limitApplied: true,
      },
    },
    meta,
    { headers: rateLimitHeaders(decision) },
  );
}
