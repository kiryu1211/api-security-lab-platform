import { z } from "zod";

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
const allowedRedirectOrigin = "https://profile-api.example.test";
const maxPayloadBytes = 2048;

const syntheticPartnerResponseSchema = z.strictObject({
  id: z.enum([
    "partner-response-safe-profile",
    "partner-response-redirect-admin",
  ]),
  provider: z.string().min(1),
  transport: z.enum(["https", "http"]),
  redirectTo: z.string().min(1).optional(),
  payloadBytes: z.number().int().nonnegative(),
  body: z.strictObject({
    displayLabel: z.string().min(1).max(80),
    profileTier: z.enum(["standard", "premium"]),
    role: z.enum(["learner", "admin"]).optional(),
    externalNotes: z.string().max(4096).optional(),
  }),
});

const syntheticPartnerResponses: Record<
  ThirdPartyProfileImportRequest["providerResponseId"],
  unknown
> = {
  "partner-response-safe-profile": {
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
  "partner-response-redirect-admin": {
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
};

function findSyntheticResponse(
  providerResponseId: ThirdPartyProfileImportRequest["providerResponseId"],
) {
  return syntheticPartnerResponses[providerResponseId];
}

function actualPayloadBytes(rawResponse: unknown) {
  try {
    const serialized = JSON.stringify(rawResponse);

    return serialized === undefined
      ? undefined
      : new TextEncoder().encode(serialized).byteLength;
  } catch {
    return undefined;
  }
}

export function unsafeImportThirdPartyProfile(
  request: ThirdPartyProfileImportRequest,
) {
  const rawResponse = findSyntheticResponse(request.providerResponseId);

  if (!rawResponse) {
    return {
      imported: false,
      reason: "unknown-response",
      providerResponseId: request.providerResponseId,
    };
  }

  const partnerResponse = rawResponse as SyntheticPartnerResponse;

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

export function validateThirdPartyProfileResponse(
  rawResponse: unknown,
  expectedProvider: ThirdPartyProfileImportRequest["expectedProvider"] = allowedProvider,
) {
  const payloadBytes = actualPayloadBytes(rawResponse);

  if (payloadBytes === undefined) {
    return {
      allowed: false,
      reason: "invalid-response-payload",
    };
  }

  if (payloadBytes > maxPayloadBytes) {
    return {
      allowed: false,
      reason: "payload-too-large",
      payloadBytes,
      maxPayloadBytes,
    };
  }

  const validation = syntheticPartnerResponseSchema.safeParse(rawResponse);

  if (!validation.success) {
    return {
      allowed: false,
      reason: "invalid-response-schema",
      issues: validation.error.issues,
    };
  }

  const partnerResponse = validation.data;

  if (partnerResponse.provider !== expectedProvider) {
    return {
      allowed: false,
      reason: "provider-mismatch",
      expectedProvider,
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

  if (!partnerResponse.redirectTo) {
    return {
      allowed: false,
      reason: "redirect-required",
    };
  }

  let redirect: URL;

  try {
    redirect = new URL(partnerResponse.redirectTo);
  } catch {
    return {
      allowed: false,
      reason: "invalid-redirect-url",
      redirectTo: partnerResponse.redirectTo,
    };
  }

  if (
    redirect.protocol !== "https:" ||
    redirect.port !== "" ||
    redirect.username !== "" ||
    redirect.password !== "" ||
    redirect.origin !== allowedRedirectOrigin
  ) {
    return {
      allowed: false,
      reason: "redirect-origin-not-allowed",
      redirectTo: partnerResponse.redirectTo,
      allowedRedirectOrigin,
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
      payloadBytesMeasured: payloadBytes,
      networkAccessPerformed: false,
    },
  };
}

export function safeImportThirdPartyProfile(
  request: ThirdPartyProfileImportRequest,
) {
  const rawResponse = findSyntheticResponse(request.providerResponseId);

  if (!rawResponse) {
    return {
      allowed: false,
      reason: "unknown-response",
      providerResponseId: request.providerResponseId,
    };
  }

  return validateThirdPartyProfileResponse(
    rawResponse,
    request.expectedProvider,
  );
}
