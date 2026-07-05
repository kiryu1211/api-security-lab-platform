import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { labSampleQuerySchema } from "@/lib/api-schemas";
import { assertVulnerableApisEnabled } from "@/lib/env";
import { listLabSamples } from "@/lib/lab-sample-service";
import {
  searchParamsToObject,
  validateWithSchema,
} from "@/lib/request-validation";

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
    labSampleQuerySchema,
    searchParamsToObject(url.searchParams),
  );

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request query does not match the expected lab sample schema.",
      meta,
      validation.issues,
    );
  }

  return apiSuccess(
    {
      warning: "Local-only vulnerable API data route. Do not expose publicly.",
      samples: listLabSamples(validation.value),
    },
    meta,
  );
}
