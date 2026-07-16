import { describe, expect, it } from "vitest";
import { learningModules } from "./learning-modules";
import { showcaseResults } from "./showcase-results";

describe("public showcase results", () => {
  it("defines serializable vulnerable and secure results for every module", () => {
    for (const learningModule of learningModules) {
      const results = showcaseResults[learningModule.id];

      expect(results.vulnerable.status).toBeGreaterThanOrEqual(200);
      expect(results.vulnerable.status).toBeLessThan(600);
      expect(results.secure.status).toBeGreaterThanOrEqual(200);
      expect(results.secure.status).toBeLessThan(600);
      expect(() => JSON.stringify(results)).not.toThrow();
      expect(results.vulnerable.body).toMatchObject({
        meta: {
          routeType: "vulnerable",
          localOnly: true,
          synthetic: true,
          source: "public-showcase",
        },
      });
      expect(results.secure.body).toMatchObject({
        meta: {
          routeType: "secure",
          synthetic: true,
          source: "public-showcase",
        },
      });
    }
  });

  it("uses the expected learning outcome status pairs", () => {
    expect(
      Object.fromEntries(
        learningModules.map(({ id }) => [
          id,
          [
            showcaseResults[id].vulnerable.status,
            showcaseResults[id].secure.status,
          ],
        ]),
      ),
    ).toEqual({
      bola: [200, 403],
      auth: [200, 401],
      "mass-assignment": [200, 403],
      "rate-limit": [200, 429],
      "function-auth": [200, 403],
      "business-flow": [200, 403],
      ssrf: [200, 403],
      "security-config": [200, 200],
      "api-inventory": [200, 403],
      "unsafe-consumption": [200, 403],
    });
  });

  it("keeps the authentication showcase aligned with the expired-token scenario", () => {
    expect(showcaseResults.auth.vulnerable.body).toMatchObject({
      data: {
        tokenDiagnostics: {
          tokenId: "demo-token-expired-admin",
          signatureState: "valid",
          expired: true,
          revoked: false,
        },
      },
    });
    expect(showcaseResults.auth.secure.body).toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        details: { reason: "expired" },
      },
    });
  });

  it("makes the no-network SSRF behavior explicit on both sides", () => {
    expect(JSON.stringify(showcaseResults.ssrf.vulnerable.body)).toContain(
      '"networkAccessPerformed":false',
    );
    expect(JSON.stringify(showcaseResults.ssrf.secure.body)).toContain(
      '"networkAccessPerformed":false',
    );
  });
});
