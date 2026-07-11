import { apiSuccess, secureRouteMeta } from "@/lib/api-response";

export function GET() {
  return apiSuccess({ status: "ok" }, secureRouteMeta());
}
