import { describe, expect, it } from "vitest";
import { POST as secureAuthPost } from "@/app/api/secure/auth/session/route";
import { POST as vulnerableAuthPost } from "@/app/api/vulnerable/auth/session/route";

const weakTokenBody = {
  tokenId: "demo-token-expired-admin",
  requiredPermission: "admin:read",
};

describe("authentication demo routes", () => {
  it("vulnerable route accepts a weak demo token in local mode", async () => {
    const response = await vulnerableAuthPost(
      new Request("http://localhost/api/vulnerable/auth/session", {
        method: "POST",
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
          signatureState: "invalid",
          revoked: true,
        },
      },
      meta: {
        routeType: "vulnerable",
        localOnly: true,
      },
    });
  });

  it("secure route rejects the same weak demo token", async () => {
    const response = await secureAuthPost(
      new Request("http://localhost/api/secure/auth/session", {
        method: "POST",
        body: JSON.stringify(weakTokenBody),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "UNAUTHORIZED",
        details: {
          reason: "invalid-signature",
        },
      },
      meta: {
        routeType: "secure",
      },
    });
  });
});
