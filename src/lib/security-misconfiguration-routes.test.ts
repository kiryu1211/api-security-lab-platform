import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as secureDiagnosticsPost } from "@/app/api/secure/config/diagnostics/route";
import { POST as vulnerableDiagnosticsPost } from "@/app/api/vulnerable/config/diagnostics/route";

const headers = { "Content-Type": "application/json" };
const body = JSON.stringify({
  requestedOrigin: "https://untrusted.example",
  includeDebugDetails: true,
});

describe("security misconfiguration demo routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("vulnerable route exposes debug diagnostics and permissive CORS metadata", async () => {
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "test");

    const response = await vulnerableDiagnosticsPost(
      new Request("http://localhost/api/vulnerable/config/diagnostics", {
        method: "POST",
        headers,
        body,
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBeNull();
    expect(responseBody.data.diagnostics.exposedConfiguration.debugMode).toBe(
      true,
    );
    expect(
      responseBody.data.diagnostics.responsePolicy
        .diagnosticExposureControlsApplied,
    ).toBe(false);
    expect(
      responseBody.data.diagnostics.responsePolicy
        .platformBaselineHeadersApplied,
    ).toBe(true);
    expect(
      responseBody.data.diagnostics.responsePolicy
        .syntheticCorsOriginReflection,
    ).toBe("https://untrusted.example");
  });

  it("secure route rejects a mismatched actual Origin and applies security headers", async () => {
    const response = await secureDiagnosticsPost(
      new Request("http://localhost/api/secure/config/diagnostics", {
        method: "POST",
        headers: { ...headers, Origin: "https://untrusted.example" },
        body,
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cross-Origin-Resource-Policy")).toBe(
      "same-origin",
    );
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(response.headers.get("Vary")).toBe("Origin");
    expect(responseBody.error.details.reason).toBe("origin-mismatch");
  });

  it("secure route allows no-Origin calls and does not authorize from the body", async () => {
    const response = await secureDiagnosticsPost(
      new Request("http://localhost/api/secure/config/diagnostics", {
        method: "POST",
        headers,
        body,
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.data.diagnostics.auditScenario).toEqual({
      requestedOrigin: "https://untrusted.example",
      usedForAuthorization: false,
    });
    expect(responseBody.data.diagnostics.controls.originHeaderPresent).toBe(
      false,
    );
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
