export type ApiInventoryOperationRequest = {
  endpointId: "legacy-token-reset-v1" | "current-token-reset-v2";
  requestedEnvironment: "production" | "staging" | "development";
};

type InventoryEntry = {
  endpointId: ApiInventoryOperationRequest["endpointId"];
  version: "v1" | "v2";
  environment: ApiInventoryOperationRequest["requestedEnvironment"];
  exposure: "public" | "internal";
  lifecycle: "active" | "deprecated" | "retired";
  ownerTeam?: string;
  documentationCurrent: boolean;
  protectionParityWithCurrent: boolean;
  handlesSensitiveFlow: boolean;
};

const inventoryEntries: InventoryEntry[] = [
  {
    endpointId: "legacy-token-reset-v1",
    version: "v1",
    environment: "production",
    exposure: "public",
    lifecycle: "retired",
    documentationCurrent: false,
    protectionParityWithCurrent: false,
    handlesSensitiveFlow: true,
  },
  {
    endpointId: "current-token-reset-v2",
    version: "v2",
    environment: "production",
    exposure: "public",
    lifecycle: "active",
    ownerTeam: "identity-platform-demo",
    documentationCurrent: true,
    protectionParityWithCurrent: true,
    handlesSensitiveFlow: true,
  },
];

function findInventoryEntry(request: ApiInventoryOperationRequest) {
  return inventoryEntries.find(
    (entry) =>
      entry.endpointId === request.endpointId &&
      entry.environment === request.requestedEnvironment,
  );
}

export function unsafeInvokeInventoryOperation(
  request: ApiInventoryOperationRequest,
) {
  const entry = findInventoryEntry(request);

  return {
    invoked: true,
    endpointId: request.endpointId,
    requestedEnvironment: request.requestedEnvironment,
    inventoryKnown: Boolean(entry),
    endpointState: entry?.lifecycle ?? "unknown",
    version: entry?.version ?? "unknown",
    syntheticOperation: {
      tokenResetPreviewCreated: true,
      realTokenIssued: false,
      realNotificationSent: false,
    },
    checks: {
      lifecycleChecked: false,
      ownerChecked: false,
      documentationFreshnessChecked: false,
      exposureReviewed: false,
      protectionParityChecked: false,
    },
  };
}

export function safeInvokeInventoryOperation(
  request: ApiInventoryOperationRequest,
) {
  const entry = findInventoryEntry(request);

  if (!entry) {
    return {
      allowed: false,
      reason: "endpoint-not-in-inventory",
      endpointId: request.endpointId,
      requestedEnvironment: request.requestedEnvironment,
    };
  }

  if (entry.lifecycle !== "active") {
    return {
      allowed: false,
      reason: "endpoint-not-active",
      endpointId: entry.endpointId,
      lifecycle: entry.lifecycle,
      version: entry.version,
    };
  }

  if (!entry.ownerTeam) {
    return {
      allowed: false,
      reason: "missing-owner",
      endpointId: entry.endpointId,
    };
  }

  if (!entry.documentationCurrent) {
    return {
      allowed: false,
      reason: "stale-documentation",
      endpointId: entry.endpointId,
    };
  }

  if (entry.exposure !== "public") {
    return {
      allowed: false,
      reason: "exposure-not-approved",
      endpointId: entry.endpointId,
      exposure: entry.exposure,
    };
  }

  if (!entry.protectionParityWithCurrent) {
    return {
      allowed: false,
      reason: "missing-protection-parity",
      endpointId: entry.endpointId,
    };
  }

  return {
    allowed: true,
    endpointId: entry.endpointId,
    version: entry.version,
    ownerTeam: entry.ownerTeam,
    syntheticOperation: {
      tokenResetPreviewCreated: true,
      realTokenIssued: false,
      realNotificationSent: false,
    },
    controls: {
      lifecycleChecked: true,
      ownerChecked: true,
      documentationFreshnessChecked: true,
      exposureReviewed: true,
      protectionParityChecked: true,
    },
  };
}
