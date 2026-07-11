import { apiError, apiSuccess, vulnerableRouteMeta } from "@/lib/api-response";
import { securityConfigAuditBodySchema } from "@/lib/api-schemas";
import { assertVulnerableApisEnabled } from "@/lib/env";
import { parseJsonRequest, validateWithSchema } from "@/lib/request-validation";
import { unsafeAuditSecurityConfig } from "@/lib/security-misconfiguration-service";

export async function POST(request: Request) {
  const meta = vulnerableRouteMeta();
  const guard = assertVulnerableApisEnabled(request);

  if (!guard.ok) {
    return apiError(
      guard.status,
      "VULNERABLE_API_DISABLED",
      guard.message,
      meta,
      guard.safety,
    );
  }

  const parsedBody = await parseJsonRequest(request, meta);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const validation = validateWithSchema(
    securityConfigAuditBodySchema,
    parsedBody.value,
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
  );
}
