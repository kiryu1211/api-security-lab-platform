import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as secureAuthSessionPost } from "@/app/api/secure/auth/session/route";
import { POST as secureBusinessFlowPost } from "@/app/api/secure/business-flow/reservations/route";
import { POST as secureConfigDiagnosticsPost } from "@/app/api/secure/config/diagnostics/route";
import { POST as secureFetchUrlPost } from "@/app/api/secure/fetch-url/route";
import { POST as secureInvitationPost } from "@/app/api/secure/admin/invitations/route";
import { POST as secureInventoryPost } from "@/app/api/secure/inventory/operations/route";
import { GET as secureOrderGet } from "@/app/api/secure/orders/[orderId]/route";
import { PATCH as secureProfilePatch } from "@/app/api/secure/profile/route";
import { GET as secureRateLimitGet } from "@/app/api/secure/rate-limit/search/route";
import { POST as secureProfileImportPost } from "@/app/api/secure/third-party/profile-import/route";
import { POST as vulnerableAuthSessionPost } from "@/app/api/vulnerable/auth/session/route";
import { POST as vulnerableBusinessFlowPost } from "@/app/api/vulnerable/business-flow/reservations/route";
import { POST as vulnerableConfigDiagnosticsPost } from "@/app/api/vulnerable/config/diagnostics/route";
import { POST as vulnerableFetchUrlPost } from "@/app/api/vulnerable/fetch-url/route";
import { GET as vulnerableHealthGet } from "@/app/api/vulnerable/health/route";
import { POST as vulnerableInvitationPost } from "@/app/api/vulnerable/admin/invitations/route";
import { POST as vulnerableInventoryPost } from "@/app/api/vulnerable/inventory/operations/route";
import { GET as vulnerableLabSamplesGet } from "@/app/api/vulnerable/lab-samples/route";
import { GET as vulnerableOrderGet } from "@/app/api/vulnerable/orders/[orderId]/route";
import { PATCH as vulnerableProfilePatch } from "@/app/api/vulnerable/profile/route";
import { GET as vulnerableRateLimitGet } from "@/app/api/vulnerable/rate-limit/search/route";
import { POST as vulnerableProfileImportPost } from "@/app/api/vulnerable/third-party/profile-import/route";
import { uiText } from "./i18n";
import { resetRateLimitBuckets } from "./rate-limit-service";

type RouteCall = {
  name: string;
  call: () => Response | Promise<Response>;
};

const jsonHeaders = { "Content-Type": "application/json" };

describe("phase 7 security verification", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetRateLimitBuckets();
  });

  it("disables every vulnerable API route in production-like settings", async () => {
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "production");

    const vulnerableRoutes: RouteCall[] = [
      {
        name: "health",
        call: () => vulnerableHealthGet(),
      },
      {
        name: "lab samples",
        call: () =>
          vulnerableLabSamplesGet(
            new Request("http://localhost/api/vulnerable/lab-samples"),
          ),
      },
      {
        name: "BOLA order",
        call: () =>
          vulnerableOrderGet(new Request("http://localhost"), {
            params: Promise.resolve({ orderId: "order-demo-002" }),
          }),
      },
      {
        name: "authentication session",
        call: () =>
          vulnerableAuthSessionPost(
            new Request("http://localhost/api/vulnerable/auth/session", {
              method: "POST",
              headers: jsonHeaders,
              body: JSON.stringify({ tokenId: "demo-token-expired-admin" }),
            }),
          ),
      },
      {
        name: "rate limit search",
        call: () =>
          vulnerableRateLimitGet(
            new Request(
              "http://localhost/api/vulnerable/rate-limit/search?userId=user-demo-alice&q=demo",
            ),
          ),
      },
      {
        name: "admin invitation",
        call: () =>
          vulnerableInvitationPost(
            new Request("http://localhost/api/vulnerable/admin/invitations", {
              method: "POST",
              headers: jsonHeaders,
              body: JSON.stringify({
                actorUserId: "user-demo-alice",
                targetEmailAlias: "analyst.demo",
                requestedRole: "admin",
              }),
            }),
          ),
      },
      {
        name: "profile update",
        call: () =>
          vulnerableProfilePatch(
            new Request("http://localhost/api/vulnerable/profile", {
              method: "PATCH",
              headers: jsonHeaders,
              body: JSON.stringify({ ownerId: "user-demo-bob" }),
            }),
          ),
      },
      {
        name: "sensitive business flow reservation",
        call: () =>
          vulnerableBusinessFlowPost(
            new Request(
              "http://localhost/api/vulnerable/business-flow/reservations",
              {
                method: "POST",
                headers: jsonHeaders,
                body: JSON.stringify({
                  userId: "user-demo-alice",
                  productId: "product-demo-001",
                  quantity: 4,
                  flowStep: "direct-checkout",
                }),
              },
            ),
          ),
      },
      {
        name: "URL fetch preview",
        call: () =>
          vulnerableFetchUrlPost(
            new Request("http://localhost/api/vulnerable/fetch-url", {
              method: "POST",
              headers: jsonHeaders,
              body: JSON.stringify({ url: "http://127.0.0.1/admin" }),
            }),
          ),
      },
      {
        name: "configuration diagnostics",
        call: () =>
          vulnerableConfigDiagnosticsPost(
            new Request("http://localhost/api/vulnerable/config/diagnostics", {
              method: "POST",
              headers: jsonHeaders,
              body: JSON.stringify({
                requestedOrigin: "https://untrusted.example",
                includeDebugDetails: true,
              }),
            }),
          ),
      },
      {
        name: "third-party profile import",
        call: () =>
          vulnerableProfileImportPost(
            new Request(
              "http://localhost/api/vulnerable/third-party/profile-import",
              {
                method: "POST",
                headers: jsonHeaders,
                body: JSON.stringify({
                  providerResponseId: "partner-response-redirect-admin",
                  expectedProvider: "trusted-profile-service",
                }),
              },
            ),
          ),
      },
      {
        name: "API inventory operation",
        call: () =>
          vulnerableInventoryPost(
            new Request(
              "http://localhost/api/vulnerable/inventory/operations",
              {
                method: "POST",
                headers: jsonHeaders,
                body: JSON.stringify({
                  endpointId: "legacy-token-reset-v1",
                  requestedEnvironment: "production",
                }),
              },
            ),
          ),
      },
    ];

    for (const route of vulnerableRoutes) {
      const response = await route.call();
      const body = await response.json();

      expect(response.status, route.name).toBe(403);
      expect(body.error.code, route.name).toBe("VULNERABLE_API_DISABLED");
      expect(body.meta, route.name).toMatchObject({
        routeType: "vulnerable",
        localOnly: true,
      });
    }
  });

  it("keeps secure APIs from reproducing the vulnerable behavior", async () => {
    resetRateLimitBuckets();

    const secureBola = await secureOrderGet(
      new Request(
        "http://localhost/api/secure/orders/order-demo-002?userId=user-demo-alice",
      ),
      { params: Promise.resolve({ orderId: "order-demo-002" }) },
    );
    const secureAuth = await secureAuthSessionPost(
      new Request("http://localhost/api/secure/auth/session", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          tokenId: "demo-token-expired-admin",
          requiredPermission: "admin:read",
        }),
      }),
    );
    const secureProfile = await secureProfilePatch(
      new Request("http://localhost/api/secure/profile", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ ownerId: "user-demo-bob", role: "reviewer" }),
      }),
    );
    const secureInvitation = await secureInvitationPost(
      new Request("http://localhost/api/secure/admin/invitations", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          actorUserId: "user-demo-alice",
          targetEmailAlias: "analyst.demo",
          requestedRole: "admin",
        }),
      }),
    );
    const secureSsrf = await secureFetchUrlPost(
      new Request("http://localhost/api/secure/fetch-url", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ url: "https://127.0.0.1/admin" }),
      }),
    );
    const secureConfigDiagnostics = await secureConfigDiagnosticsPost(
      new Request("http://localhost/api/secure/config/diagnostics", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          requestedOrigin: "https://untrusted.example",
          includeDebugDetails: true,
        }),
      }),
    );
    const secureBusinessFlow = await secureBusinessFlowPost(
      new Request("http://localhost/api/secure/business-flow/reservations", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          userId: "user-demo-alice",
          productId: "product-demo-001",
          quantity: 4,
          flowStep: "direct-checkout",
        }),
      }),
    );
    const secureProfileImport = await secureProfileImportPost(
      new Request("http://localhost/api/secure/third-party/profile-import", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          providerResponseId: "partner-response-redirect-admin",
          expectedProvider: "trusted-profile-service",
        }),
      }),
    );
    const secureInventory = await secureInventoryPost(
      new Request("http://localhost/api/secure/inventory/operations", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          endpointId: "legacy-token-reset-v1",
          requestedEnvironment: "production",
        }),
      }),
    );

    const rateLimitRequests = await Promise.all([
      secureRateLimitGet(
        new Request(
          "http://localhost/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
        ),
      ),
      secureRateLimitGet(
        new Request(
          "http://localhost/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
        ),
      ),
      secureRateLimitGet(
        new Request(
          "http://localhost/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
        ),
      ),
      secureRateLimitGet(
        new Request(
          "http://localhost/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
        ),
      ),
    ]);

    expect(secureBola.status).toBe(403);
    expect(secureAuth.status).toBe(401);
    expect(secureInvitation.status).toBe(403);
    expect(secureProfile.status).toBe(403);
    expect(await secureProfile.json()).toMatchObject({
      error: {
        code: "FORBIDDEN",
        details: {
          rejectedProperties: expect.arrayContaining(["ownerId", "role"]),
        },
      },
    });
    expect(secureSsrf.status).toBe(403);
    expect(secureConfigDiagnostics.status).toBe(403);
    expect(secureConfigDiagnostics.headers.get("X-Content-Type-Options")).toBe(
      "nosniff",
    );
    expect(secureBusinessFlow.status).toBe(403);
    expect(secureProfileImport.status).toBe(403);
    expect(secureInventory.status).toBe(403);
    expect(rateLimitRequests.at(-1)?.status).toBe(429);
  });

  it("keeps shared UI text resources structurally aligned across languages", () => {
    expect(Object.keys(uiText.ja).sort()).toEqual(
      Object.keys(uiText.en).sort(),
    );
    expect(Object.keys(uiText.ja.nav).sort()).toEqual(
      Object.keys(uiText.en.nav).sort(),
    );
    expect(Object.keys(uiText.ja.comparison).sort()).toEqual(
      Object.keys(uiText.en.comparison).sort(),
    );
    expect(uiText.ja.nav.label).toBe("メインナビゲーション");
    expect(uiText.en.nav.label).toBe("Main navigation");
  });
});
