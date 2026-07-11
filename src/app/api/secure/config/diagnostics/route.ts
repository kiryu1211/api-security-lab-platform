import { apiError, apiSuccess, secureRouteMeta } from "@/lib/api-response";
import { securityConfigAuditBodySchema } from "@/lib/api-schemas";
import { parseJsonRequest, validateWithSchema } from "@/lib/request-validation";
import {
  safeAuditSecurityConfig,
  secureMisconfigurationHeaders,
} from "@/lib/security-misconfiguration-service";

export async function POST(request: Request) {
  const meta = secureRouteMeta();
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

  const decision = safeAuditSecurityConfig(validation.value, {
    originHeader: request.headers.get("Origin"),
    requestUrl: request.url,
  });

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
        auditScenario: decision.auditScenario,
        publicConfiguration: decision.publicConfiguration,
        controls: decision.controls,
      },
    },
    meta,
    { headers: secureMisconfigurationHeaders() },
  );
}
