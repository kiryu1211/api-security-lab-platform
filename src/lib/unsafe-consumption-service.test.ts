import { describe, expect, it } from "vitest";
import {
  safeImportThirdPartyProfile,
  unsafeImportThirdPartyProfile,
  validateThirdPartyProfileResponse,
} from "./unsafe-consumption-service";

const compromisedResponseRequest = {
  providerResponseId: "partner-response-redirect-admin" as const,
  expectedProvider: "trusted-profile-service" as const,
};

describe("unsafe-consumption-service", () => {
  it("shows the vulnerable flow importing untrusted partner fields", () => {
    const result = unsafeImportThirdPartyProfile(compromisedResponseRequest);

    expect(result).toMatchObject({
      imported: true,
      acceptedRedirectTo: "https://attacker.example.test/collect-profile",
      importedProfile: {
        role: "admin",
      },
      checks: {
        redirectAllowlistChecked: false,
        privilegedFieldsRejected: false,
      },
    });
  });

  it("rejects partner responses that redirect outside the allowlist", () => {
    const result = safeImportThirdPartyProfile(compromisedResponseRequest);

    expect(result).toMatchObject({
      allowed: false,
      reason: "redirect-origin-not-allowed",
      allowedRedirectOrigin: "https://profile-api.example.test",
    });
  });

  it("imports safe partner responses without privileged fields", () => {
    const result = safeImportThirdPartyProfile({
      providerResponseId: "partner-response-safe-profile",
      expectedProvider: "trusted-profile-service",
    });

    expect(result).toMatchObject({
      allowed: true,
      importedProfile: {
        displayLabel: "alice-from-partner",
        profileTier: "standard",
      },
      controls: {
        redirectAllowlistChecked: true,
        privilegedFieldsRejected: true,
        networkAccessPerformed: false,
      },
    });
  });

  it("rejects malformed responses with the runtime schema", () => {
    const result = validateThirdPartyProfileResponse({
      id: "partner-response-safe-profile",
      provider: "trusted-profile-service",
      transport: "https",
      redirectTo: "https://profile-api.example.test/profile",
      payloadBytes: 1,
      body: {
        displayLabel: 42,
        profileTier: "standard",
      },
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "invalid-response-schema",
    });
  });

  it("rejects extra fields with the strict response schema", () => {
    const result = validateThirdPartyProfileResponse({
      id: "partner-response-safe-profile",
      provider: "trusted-profile-service",
      transport: "https",
      redirectTo: "https://profile-api.example.test/profile",
      payloadBytes: 1,
      body: {
        displayLabel: "partner-profile",
        profileTier: "standard",
        unexpected: true,
      },
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "invalid-response-schema",
    });
  });

  it("rejects a malformed redirect URL", () => {
    const result = validateThirdPartyProfileResponse({
      id: "partner-response-safe-profile",
      provider: "trusted-profile-service",
      transport: "https",
      redirectTo: "not-a-url",
      payloadBytes: 1,
      body: {
        displayLabel: "partner-profile",
        profileTier: "standard",
      },
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "invalid-redirect-url",
    });
  });

  it.each([
    "http://profile-api.example.test/profile",
    "https://profile-api.example.test:444/profile",
    "https://demo:secret@profile-api.example.test/profile",
  ])("rejects an unsafe redirect URL: %s", (redirectTo) => {
    const result = validateThirdPartyProfileResponse({
      id: "partner-response-safe-profile",
      provider: "trusted-profile-service",
      transport: "https",
      redirectTo,
      payloadBytes: 1,
      body: {
        displayLabel: "partner-profile",
        profileTier: "standard",
      },
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "redirect-origin-not-allowed",
    });
  });

  it("accepts the HTTPS allowlist origin with an explicit default port", () => {
    const result = validateThirdPartyProfileResponse({
      id: "partner-response-safe-profile",
      provider: "trusted-profile-service",
      transport: "https",
      redirectTo: "https://profile-api.example.test:443/profile",
      payloadBytes: 999_999,
      body: {
        displayLabel: "partner-profile",
        profileTier: "standard",
      },
    });

    expect(result).toMatchObject({
      allowed: true,
      controls: {
        payloadBytesMeasured: expect.any(Number),
      },
    });
  });

  it("rejects actual oversized payloads despite small size metadata", () => {
    const result = validateThirdPartyProfileResponse({
      id: "partner-response-safe-profile",
      provider: "trusted-profile-service",
      transport: "https",
      redirectTo: "https://profile-api.example.test/profile",
      payloadBytes: 1,
      body: {
        displayLabel: "partner-profile",
        profileTier: "standard",
        externalNotes: "x".repeat(3000),
      },
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "payload-too-large",
    });
  });

  it("rejects privileged response fields on an otherwise allowed response", () => {
    const result = validateThirdPartyProfileResponse({
      id: "partner-response-safe-profile",
      provider: "trusted-profile-service",
      transport: "https",
      redirectTo: "https://profile-api.example.test/profile",
      payloadBytes: 1,
      body: {
        displayLabel: "partner-profile",
        profileTier: "standard",
        role: "admin",
      },
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "privileged-field-from-partner",
    });
  });
});
