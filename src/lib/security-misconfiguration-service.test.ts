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
  it("shows the vulnerable flow exposing debug configuration and wildcard CORS", () => {
    const result = unsafeAuditSecurityConfig(untrustedDebugRequest);

    expect(result.accepted).toBe(true);
    expect(result.exposedConfiguration.debugMode).toBe(true);
    expect(result.exposedConfiguration.syntheticStackTrace).toContain(
      "DemoError",
    );
    expect(result.responsePolicy).toMatchObject({
      corsOriginReflected: "*",
      credentialsAllowedWithWildcardOrigin: true,
      securityHeadersApplied: false,
    });
  });

  it("rejects untrusted origins before returning diagnostics", () => {
    const result = safeAuditSecurityConfig(untrustedDebugRequest);

    expect(result).toMatchObject({
      allowed: false,
      reason: "origin-not-allowed",
      controls: {
        corsAllowlistChecked: true,
        debugDetailsSuppressed: true,
        securityHeadersApplied: true,
      },
    });
  });

  it("returns minimal public configuration for allowed origins", () => {
    const result = safeAuditSecurityConfig({
      requestedOrigin: "https://lab.example.test",
      includeDebugDetails: true,
    });

    expect(result).toMatchObject({
      allowed: true,
      publicConfiguration: {
        debugMode: false,
        stackTraceEnabled: false,
      },
      controls: {
        corsAllowlistChecked: true,
        verboseErrorsReturned: false,
      },
    });
  });
});
