import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as secureAuthPost } from "@/app/api/secure/auth/session/route";
import { POST as vulnerableAuthPost } from "@/app/api/vulnerable/auth/session/route";

const weakTokenBody = {
  tokenId: "demo-token-expired-admin",
  requiredPermission: "admin:read",
};
const jsonHeaders = { "Content-Type": "application/json" };

describe("authentication demo routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("vulnerable route accepts a weak demo token in local mode", async () => {
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "test");

    const response = await vulnerableAuthPost(
      new Request("http://localhost/api/vulnerable/auth/session", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(weakTokenBody),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      data: {
        subjectUserId: "user-demo-bob",
        tokenDiagnostics: {
          tokenId: "demo-token-expired-admin",
          signatureState: "valid",
          expired: true,
          revoked: false,
        },
      },
      meta: {
        routeType: "vulnerable",
        localOnly: true,
      },
    });
  });

  it.each([
    ["demo-token-invalid-signature-admin", "invalid-signature"],
    ["demo-token-expired-admin", "expired"],
    ["demo-token-revoked-admin", "revoked"],
  ] as const)("secure route rejects %s for %s", async (tokenId, reason) => {
    const response = await secureAuthPost(
      new Request("http://localhost/api/secure/auth/session", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          tokenId,
          requiredPermission: "admin:read",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        details: {
          reason,
        },
      },
      meta: {
        routeType: "secure",
      },
    });
  });
});
