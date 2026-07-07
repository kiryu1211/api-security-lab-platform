import { describe, expect, it } from "vitest";
import {
  safeInvokeInventoryOperation,
  unsafeInvokeInventoryOperation,
} from "./api-inventory-service";

const retiredOperationRequest = {
  endpointId: "legacy-token-reset-v1" as const,
  requestedEnvironment: "production" as const,
};

describe("api-inventory-service", () => {
  it("shows the vulnerable flow invoking a retired legacy operation", () => {
    const result = unsafeInvokeInventoryOperation(retiredOperationRequest);

    expect(result).toMatchObject({
      invoked: true,
      endpointId: "legacy-token-reset-v1",
      endpointState: "retired",
      syntheticOperation: {
        tokenResetPreviewCreated: true,
        realTokenIssued: false,
        realNotificationSent: false,
      },
      checks: {
        lifecycleChecked: false,
        protectionParityChecked: false,
      },
    });
  });

  it("rejects retired endpoints before operation processing", () => {
    const result = safeInvokeInventoryOperation(retiredOperationRequest);

    expect(result).toMatchObject({
      allowed: false,
      reason: "endpoint-not-active",
      lifecycle: "retired",
      version: "v1",
    });
  });

  it("allows current inventoried endpoints with protection parity", () => {
    const result = safeInvokeInventoryOperation({
      endpointId: "current-token-reset-v2",
      requestedEnvironment: "production",
    });

    expect(result).toMatchObject({
      allowed: true,
      endpointId: "current-token-reset-v2",
      controls: {
        lifecycleChecked: true,
        ownerChecked: true,
        documentationFreshnessChecked: true,
        exposureReviewed: true,
        protectionParityChecked: true,
      },
      syntheticOperation: {
        realTokenIssued: false,
        realNotificationSent: false,
      },
    });
  });
});
