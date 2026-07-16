import { describe, expect, it } from "vitest";
import { findDemoToken } from "@/data/auth-samples";
import { createVerifiedSession, createWeakSession } from "./auth-token-service";

describe("auth token service", () => {
  it("keeps signature, expiration, and revocation failure fixtures independent", () => {
    expect(findDemoToken("demo-token-invalid-signature-admin")).toMatchObject({
      signatureState: "invalid",
      expiresAtEpochMs: 4102444800000,
      revoked: false,
    });
    expect(findDemoToken("demo-token-expired-admin")).toMatchObject({
      signatureState: "valid",
      expiresAtEpochMs: 946684800000,
      revoked: false,
    });
    expect(findDemoToken("demo-token-revoked-admin")).toMatchObject({
      signatureState: "valid",
      expiresAtEpochMs: 4102444800000,
      revoked: true,
    });
  });

  it("weak validation accepts a known token without checking signature, expiration, revocation, or permission", () => {
    expect(createWeakSession("demo-token-expired-admin")).toMatchObject({
      ok: true,
      token: {
        id: "demo-token-expired-admin",
        signatureState: "valid",
        expiresAtEpochMs: 946684800000,
        revoked: false,
      },
      acceptedChecks: ["token-id-present"],
    });
  });

  it.each([
    ["demo-token-invalid-signature-admin", "invalid-signature"],
    ["demo-token-expired-admin", "expired"],
    ["demo-token-revoked-admin", "revoked"],
  ] as const)(
    "secure validation rejects %s for %s",
    (tokenId, expectedReason) => {
      expect(
        createVerifiedSession(tokenId, "admin:read", 1700000000000),
      ).toMatchObject({
        ok: false,
        reason: expectedReason,
      });
    },
  );

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
