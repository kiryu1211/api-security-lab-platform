import { apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { getLabRuntimeSafety } from "@/lib/env";

export function GET() {
  return apiSuccess({ safety: getLabRuntimeSafety() }, secureRouteMeta());
}
