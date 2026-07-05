import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { labSampleQuerySchema } from "@/lib/api-schemas";
import { listLabSamples } from "@/lib/lab-sample-service";
import {
  searchParamsToObject,
  validateWithSchema,
} from "@/lib/request-validation";

export function GET(request: Request) {
  const url = new URL(request.url);
  const validation = validateWithSchema(
    labSampleQuerySchema,
    searchParamsToObject(url.searchParams),
  );
  const meta = secureRouteMeta();

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request query does not match the expected lab sample schema.",
      meta,
      validation.issues,
    );
  }

  return apiSuccess(listLabSamples(validation.value), meta);
}
