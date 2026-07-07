export type ThirdPartyProfileImportRequest = {
  providerResponseId:
    "partner-response-safe-profile" | "partner-response-redirect-admin";
  expectedProvider: "trusted-profile-service";
};

type SyntheticPartnerResponse = {
  id: ThirdPartyProfileImportRequest["providerResponseId"];
  provider: string;
  transport: "https" | "http";
  redirectTo?: string;
  payloadBytes: number;
  body: {
    displayLabel: string;
    profileTier: "standard" | "premium";
    role?: "learner" | "admin";
    externalNotes?: string;
  };
};

const allowedProvider = "trusted-profile-service";
const allowedRedirectHost = "profile-api.example.test";
const maxPayloadBytes = 2048;

const syntheticPartnerResponses: SyntheticPartnerResponse[] = [
  {
    id: "partner-response-safe-profile",
    provider: allowedProvider,
    transport: "https",
    redirectTo: "https://profile-api.example.test/v1/profiles/user-demo-alice",
    payloadBytes: 512,
    body: {
      displayLabel: "alice-from-partner",
      profileTier: "standard",
      externalNotes: "synthetic-safe-response",
    },
  },
  {
    id: "partner-response-redirect-admin",
    provider: allowedProvider,
    transport: "https",
    redirectTo: "https://attacker.example.test/collect-profile",
    payloadBytes: 1536,
    body: {
      displayLabel: "alice-from-compromised-partner",
      profileTier: "premium",
      role: "admin",
      externalNotes: "synthetic-compromised-response",
    },
  },
];

function findSyntheticResponse(
  providerResponseId: ThirdPartyProfileImportRequest["providerResponseId"],
) {
  return syntheticPartnerResponses.find(
    (response) => response.id === providerResponseId,
  );
}

function redirectHost(redirectTo?: string) {
  if (!redirectTo) {
    return undefined;
  }

  return new URL(redirectTo).hostname;
}

export function unsafeImportThirdPartyProfile(
  request: ThirdPartyProfileImportRequest,
) {
  const partnerResponse = findSyntheticResponse(request.providerResponseId);

  if (!partnerResponse) {
    return {
      imported: false,
      reason: "unknown-response",
      providerResponseId: request.providerResponseId,
    };
  }

  return {
    imported: true,
    providerResponseId: partnerResponse.id,
    trustedProviderWithoutVerification: partnerResponse.provider,
    acceptedRedirectTo: partnerResponse.redirectTo,
    importedProfile: {
      displayLabel: partnerResponse.body.displayLabel,
      profileTier: partnerResponse.body.profileTier,
      role: partnerResponse.body.role ?? "learner",
      externalNotes: partnerResponse.body.externalNotes,
    },
    checks: {
      providerMatched: false,
      transportChecked: false,
      redirectAllowlistChecked: false,
      responseSchemaChecked: false,
      privilegedFieldsRejected: false,
    },
  };
}

export function safeImportThirdPartyProfile(
  request: ThirdPartyProfileImportRequest,
) {
  const partnerResponse = findSyntheticResponse(request.providerResponseId);

  if (!partnerResponse) {
    return {
      allowed: false,
      reason: "unknown-response",
      providerResponseId: request.providerResponseId,
    };
  }

  if (partnerResponse.provider !== request.expectedProvider) {
    return {
      allowed: false,
      reason: "provider-mismatch",
      expectedProvider: request.expectedProvider,
      receivedProvider: partnerResponse.provider,
    };
  }

  if (partnerResponse.transport !== "https") {
    return {
      allowed: false,
      reason: "insecure-transport",
      transport: partnerResponse.transport,
    };
  }

  if (partnerResponse.payloadBytes > maxPayloadBytes) {
    return {
      allowed: false,
      reason: "payload-too-large",
      payloadBytes: partnerResponse.payloadBytes,
      maxPayloadBytes,
    };
  }

  const host = redirectHost(partnerResponse.redirectTo);

  if (host !== allowedRedirectHost) {
    return {
      allowed: false,
      reason: "redirect-host-not-allowed",
      redirectTo: partnerResponse.redirectTo,
      allowedRedirectHost,
    };
  }

  if (partnerResponse.body.role) {
    return {
      allowed: false,
      reason: "privileged-field-from-partner",
      rejectedFields: ["role"],
    };
  }

  return {
    allowed: true,
    importedProfile: {
      displayLabel: partnerResponse.body.displayLabel,
      profileTier: partnerResponse.body.profileTier,
    },
    controls: {
      providerMatched: true,
      transportChecked: true,
      redirectAllowlistChecked: true,
      responseSchemaChecked: true,
      privilegedFieldsRejected: true,
      networkAccessPerformed: false,
    },
  };
}
