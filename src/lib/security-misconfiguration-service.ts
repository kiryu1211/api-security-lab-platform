export type SecurityConfigAuditRequest = {
  requestedOrigin: "https://lab.example.test" | "https://untrusted.example";
  includeDebugDetails: boolean;
};

export type SecurityConfigRequestContext = {
  originHeader: string | null;
  requestUrl: string;
};

const syntheticRuntimeConfig = {
  serviceName: "api-security-lab-demo",
  environmentLabel: "local-demo",
  debugMode: true,
  stackTraceEnabled: true,
  corsPolicy: "reflect-requested-origin-with-credentials",
  adminConsolePreviewPath: "/internal-demo/admin-console",
  sampleBuildId: "build-demo-2026-07",
};

const secureHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Referrer-Policy": "no-referrer",
  Vary: "Origin",
  "X-Content-Type-Options": "nosniff",
} as const;

function inspectRequestOrigin(context: SecurityConfigRequestContext) {
  let requestUrlOrigin: string;

  try {
    requestUrlOrigin = new URL(context.requestUrl).origin;
  } catch {
    return {
      allowed: false as const,
      reason: "invalid-request-url",
      originHeader: context.originHeader,
    };
  }

  if (context.originHeader === null) {
    return {
      allowed: true as const,
      originHeader: null,
      requestUrlOrigin,
    };
  }

  try {
    const origin = new URL(context.originHeader);
    const isSerializedOrigin =
      origin.username === "" &&
      origin.password === "" &&
      origin.pathname === "/" &&
      origin.search === "" &&
      origin.hash === "";

    if (!isSerializedOrigin || origin.origin !== requestUrlOrigin) {
      return {
        allowed: false as const,
        reason: "origin-mismatch",
        originHeader: context.originHeader,
        requestUrlOrigin,
      };
    }
  } catch {
    return {
      allowed: false as const,
      reason: "origin-mismatch",
      originHeader: context.originHeader,
      requestUrlOrigin,
    };
  }

  return {
    allowed: true as const,
    originHeader: context.originHeader,
    requestUrlOrigin,
  };
}

export function unsafeAuditSecurityConfig(request: SecurityConfigAuditRequest) {
  return {
    accepted: true,
    auditScenario: {
      requestedOrigin: request.requestedOrigin,
      usedForAuthorization: false,
    },
    exposedConfiguration: {
      ...syntheticRuntimeConfig,
      debugDetailsIncluded: request.includeDebugDetails,
      syntheticStackTrace: request.includeDebugDetails
        ? "DemoError: synthetic configuration failure at demo-handler.ts:42"
        : undefined,
    },
    responsePolicy: {
      syntheticCorsOriginReflection: request.requestedOrigin,
      syntheticCredentialsAllowed: true,
      platformBaselineHeadersApplied: true,
      diagnosticExposureControlsApplied: false,
      cacheDisabled: true,
      verboseErrorsReturned: request.includeDebugDetails,
    },
    risk: "Security configuration audit exposes debug settings, synthetic permissive CORS metadata, and verbose error details.",
  };
}

export function safeAuditSecurityConfig(
  request: SecurityConfigAuditRequest,
  context: SecurityConfigRequestContext,
) {
  const originDecision = inspectRequestOrigin(context);

  if (!originDecision.allowed) {
    return {
      ...originDecision,
      auditScenario: {
        requestedOrigin: request.requestedOrigin,
        usedForAuthorization: false,
      },
      controls: {
        requestOriginChecked: true,
        debugDetailsSuppressed: true,
        securityHeadersApplied: true,
        cacheDisabled: true,
      },
    };
  }

  return {
    allowed: true,
    auditScenario: {
      requestedOrigin: request.requestedOrigin,
      usedForAuthorization: false,
    },
    publicConfiguration: {
      serviceName: syntheticRuntimeConfig.serviceName,
      environmentLabel: syntheticRuntimeConfig.environmentLabel,
      debugMode: false,
      stackTraceEnabled: false,
    },
    controls: {
      requestOriginChecked: true,
      originHeaderPresent: originDecision.originHeader !== null,
      debugDetailsSuppressed: true,
      securityHeadersApplied: true,
      cacheDisabled: true,
      verboseErrorsReturned: false,
    },
    headers: secureHeaders,
  };
}

export function secureMisconfigurationHeaders() {
  return secureHeaders;
}
