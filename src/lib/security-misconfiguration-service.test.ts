import { describe, expect, it } from "vitest";
import {
  safeAuditSecurityConfig,
  unsafeAuditSecurityConfig,
} from "./security-misconfiguration-service";

const untrustedDebugRequest = {
  requestedOrigin: "https://untrusted.example" as const,
  includeDebugDetails: true,
};

describe("security-misconfiguration-service", () => {
  it("shows the vulnerable flow reflecting its synthetic origin with credentials", () => {
    const result = unsafeAuditSecurityConfig(untrustedDebugRequest);

    expect(result.accepted).toBe(true);
    expect(result.exposedConfiguration.debugMode).toBe(true);
    expect(result.exposedConfiguration.syntheticStackTrace).toContain(
      "DemoError",
    );
    expect(result.responsePolicy).toMatchObject({
      syntheticCorsOriginReflection: "https://untrusted.example",
      syntheticCredentialsAllowed: true,
      platformBaselineHeadersApplied: true,
      diagnosticExposureControlsApplied: false,
    });
  });

  it("rejects an actual Origin that differs from the request URL origin", () => {
    const result = safeAuditSecurityConfig(untrustedDebugRequest, {
      originHeader: "https://untrusted.example",
      requestUrl: "http://localhost/api/secure/config/diagnostics",
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "origin-mismatch",
      auditScenario: {
        requestedOrigin: "https://untrusted.example",
        usedForAuthorization: false,
      },
      controls: {
        requestOriginChecked: true,
        debugDetailsSuppressed: true,
        securityHeadersApplied: true,
      },
    });
  });

  it("allows no-Origin calls regardless of the synthetic requested origin", () => {
    const result = safeAuditSecurityConfig(untrustedDebugRequest, {
      originHeader: null,
      requestUrl: "http://localhost/api/secure/config/diagnostics",
    });

    expect(result).toMatchObject({
      allowed: true,
      publicConfiguration: {
        debugMode: false,
        stackTraceEnabled: false,
      },
      controls: {
        requestOriginChecked: true,
        originHeaderPresent: false,
        verboseErrorsReturned: false,
      },
    });
  });

  it("allows an actual same-origin browser call", () => {
    const result = safeAuditSecurityConfig(untrustedDebugRequest, {
      originHeader: "http://localhost",
      requestUrl: "http://localhost/api/secure/config/diagnostics",
    });

    expect(result.allowed).toBe(true);
  });
});
