import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { assertVulnerableApisEnabled } from "@/lib/env";

export function GET() {
  const guard = assertVulnerableApisEnabled();
  const meta = vulnerableRouteMeta();

  if (!guard.ok) {
    return apiError(
      guard.status,
      "VULNERABLE_API_DISABLED",
      guard.message,
      meta,
      guard.safety,
    );
  }

  return apiSuccess(
    {
      warning: "Local-only vulnerable API route. Do not expose publicly.",
      safety: guard.safety,
    },
    meta,
  );
}
