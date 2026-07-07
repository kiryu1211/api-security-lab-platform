import { describe, expect, it } from "vitest";
import { POST as secureDiagnosticsPost } from "@/app/api/secure/config/diagnostics/route";
import { POST as vulnerableDiagnosticsPost } from "@/app/api/vulnerable/config/diagnostics/route";

const headers = { "Content-Type": "application/json" };
const body = JSON.stringify({
  requestedOrigin: "https://untrusted.example",
  includeDebugDetails: true,
});

describe("security misconfiguration demo routes", () => {
  it("vulnerable route exposes debug diagnostics and permissive CORS metadata", async () => {
    const response = await vulnerableDiagnosticsPost(
      new Request("http://localhost/api/vulnerable/config/diagnostics", {
        method: "POST",
        headers,
        body,
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(responseBody.data.diagnostics.exposedConfiguration.debugMode).toBe(
      true,
    );
    expect(
      responseBody.data.diagnostics.responsePolicy.securityHeadersApplied,
    ).toBe(false);
  });

  it("secure route rejects untrusted origins and applies security headers", async () => {
    const response = await secureDiagnosticsPost(
      new Request("http://localhost/api/secure/config/diagnostics", {
        method: "POST",
        headers,
        body,
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(responseBody.error.details.reason).toBe("origin-not-allowed");
  });
});
