export type SecurityConfigAuditRequest = {
  requestedOrigin: "https://lab.example.test" | "https://untrusted.example";
  includeDebugDetails: boolean;
};

const allowedOrigins: SecurityConfigAuditRequest["requestedOrigin"][] = [
  "https://lab.example.test",
];

const syntheticRuntimeConfig = {
  serviceName: "api-security-lab-demo",
  environmentLabel: "local-demo",
  debugMode: true,
  stackTraceEnabled: true,
  corsPolicy: "wildcard-with-credentials",
  adminConsolePreviewPath: "/internal-demo/admin-console",
  sampleBuildId: "build-demo-2026-07",
};

const secureHeaders = {
  "Access-Control-Allow-Origin": "https://lab.example.test",
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
} as const;

export function unsafeAuditSecurityConfig(request: SecurityConfigAuditRequest) {
  return {
    accepted: true,
    requestedOrigin: request.requestedOrigin,
    exposedConfiguration: {
      ...syntheticRuntimeConfig,
      debugDetailsIncluded: request.includeDebugDetails,
      syntheticStackTrace: request.includeDebugDetails
        ? "DemoError: synthetic configuration failure at demo-handler.ts:42"
        : undefined,
    },
    responsePolicy: {
      corsOriginReflected: "*",
      credentialsAllowedWithWildcardOrigin: true,
      securityHeadersApplied: false,
      cacheDisabled: false,
      verboseErrorsReturned: request.includeDebugDetails,
    },
    risk: "Security configuration audit exposes debug settings, wildcard CORS, and verbose error details.",
  };
}

export function safeAuditSecurityConfig(request: SecurityConfigAuditRequest) {
  if (!allowedOrigins.includes(request.requestedOrigin)) {
    return {
      allowed: false,
      reason: "origin-not-allowed",
      requestedOrigin: request.requestedOrigin,
      allowedOrigins: [...allowedOrigins],
      controls: {
        corsAllowlistChecked: true,
        debugDetailsSuppressed: true,
        securityHeadersApplied: true,
        cacheDisabled: true,
      },
    };
  }

  return {
    allowed: true,
    publicConfiguration: {
      serviceName: syntheticRuntimeConfig.serviceName,
      environmentLabel: syntheticRuntimeConfig.environmentLabel,
      debugMode: false,
      stackTraceEnabled: false,
    },
    controls: {
      corsAllowlistChecked: true,
      debugDetailsSuppressed: true,
      securityHeadersApplied: true,
      cacheDisabled: true,
      verboseErrorsReturned: false,
    },
    headers: secureHeaders,
  };
}

export function vulnerableMisconfigurationHeaders() {
  return {
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Origin": "*",
  };
}

export function secureMisconfigurationHeaders() {
  return secureHeaders;
}
