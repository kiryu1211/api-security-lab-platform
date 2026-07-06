import { describe, expect, it } from "vitest";
import { createVerifiedSession, createWeakSession } from "./auth-token-service";

describe("auth token service", () => {
  it("weak validation accepts a known token without checking signature, expiration, revocation, or permission", () => {
    expect(createWeakSession("demo-token-expired-admin")).toMatchObject({
      ok: true,
      token: {
        id: "demo-token-expired-admin",
        signatureState: "invalid",
        revoked: true,
      },
      acceptedChecks: ["token-id-present"],
    });
  });

  it("secure validation rejects a token with an invalid signature before creating a session", () => {
    expect(
      createVerifiedSession(
        "demo-token-expired-admin",
        "admin:read",
        1700000000000,
      ),
    ).toMatchObject({
      ok: false,
      reason: "invalid-signature",
    });
  });

  it("secure validation accepts a valid token with the required permission", () => {
    expect(
      createVerifiedSession(
        "demo-token-valid-reader",
        "orders:read",
        1700000000000,
      ),
    ).toMatchObject({
      ok: true,
      acceptedChecks: ["signature", "expiration", "revocation", "permission"],
    });
  });

  it("secure validation rejects a valid token without the required permission", () => {
    expect(
      createVerifiedSession(
        "demo-token-limited-reader",
        "admin:read",
        1700000000000,
      ),
    ).toMatchObject({
      ok: false,
      reason: "missing-permission",
    });
  });
});
