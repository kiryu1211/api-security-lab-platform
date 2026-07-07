import { describe, expect, it } from "vitest";
import {
  safeImportThirdPartyProfile,
  unsafeImportThirdPartyProfile,
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
      reason: "redirect-host-not-allowed",
      allowedRedirectHost: "profile-api.example.test",
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
});
