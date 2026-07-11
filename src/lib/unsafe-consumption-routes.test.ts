import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as secureProfileImportPost } from "@/app/api/secure/third-party/profile-import/route";
import { POST as vulnerableProfileImportPost } from "@/app/api/vulnerable/third-party/profile-import/route";

const headers = { "Content-Type": "application/json" };
const body = JSON.stringify({
  providerResponseId: "partner-response-redirect-admin",
  expectedProvider: "trusted-profile-service",
});

describe("unsafe consumption demo routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("vulnerable route imports untrusted third-party response fields", async () => {
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "test");

    const response = await vulnerableProfileImportPost(
      new Request(
        "http://localhost/api/vulnerable/third-party/profile-import",
        {
          method: "POST",
          headers,
          body,
        },
      ),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.data.importResult.importedProfile.role).toBe("admin");
    expect(responseBody.data.importResult.acceptedRedirectTo).toBe(
      "https://attacker.example.test/collect-profile",
    );
  });

  it("secure route rejects untrusted redirect targets from third-party responses", async () => {
    const response = await secureProfileImportPost(
      new Request("http://localhost/api/secure/third-party/profile-import", {
        method: "POST",
        headers,
        body,
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody.error.details.reason).toBe(
      "redirect-origin-not-allowed",
    );
  });
});
