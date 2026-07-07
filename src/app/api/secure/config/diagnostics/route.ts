import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { securityConfigAuditBodySchema } from "@/lib/api-schemas";
import { readJsonBody, validateWithSchema } from "@/lib/request-validation";
import {
  safeAuditSecurityConfig,
  secureMisconfigurationHeaders,
} from "@/lib/security-misconfiguration-service";

export async function POST(request: Request) {
  const meta = secureRouteMeta();
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

  const decision = safeAuditSecurityConfig(validation.value);

  if (!decision.allowed) {
    const response = apiError(
      403,
      "FORBIDDEN",
      "Security configuration diagnostics were rejected by the origin and exposure policy.",
      meta,
      decision,
    );

    for (const [name, value] of Object.entries(
      secureMisconfigurationHeaders(),
    )) {
      response.headers.set(name, value);
    }

    return response;
  }

  return apiSuccess(
    {
      diagnostics: {
        publicConfiguration: decision.publicConfiguration,
        controls: decision.controls,
      },
    },
    meta,
    { headers: secureMisconfigurationHeaders() },
  );
}
