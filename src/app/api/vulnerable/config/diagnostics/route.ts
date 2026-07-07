import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { securityConfigAuditBodySchema } from "@/lib/api-schemas";
import { assertVulnerableApisEnabled } from "@/lib/env";
import { readJsonBody, validateWithSchema } from "@/lib/request-validation";
import {
  unsafeAuditSecurityConfig,
  vulnerableMisconfigurationHeaders,
} from "@/lib/security-misconfiguration-service";

export async function POST(request: Request) {
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

  const validation = validateWithSchema(
    securityConfigAuditBodySchema,
    await readJsonBody(request),
  );

  if (!validation.ok) {
    return apiError(
      400,
      "VALIDATION_ERROR",
      "Request body does not match the expected security configuration audit schema.",
      meta,
      validation.issues,
    );
  }

  return apiSuccess(
    {
      warning:
        "This vulnerable security misconfiguration example exposes debug configuration and permissive response policy metadata.",
      diagnostics: unsafeAuditSecurityConfig(validation.value),
    },
    meta,
    { headers: vulnerableMisconfigurationHeaders() },
  );
}
