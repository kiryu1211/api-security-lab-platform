import { beforeEach, describe, expect, it } from "vitest";
import {
  resetBusinessFlowState,
  safeReserveSensitiveFlow,
  unsafeReserveSensitiveFlow,
} from "./business-flow-service";

const excessiveDirectReservation = {
  userId: "user-demo-alice",
  productId: "product-demo-001",
  quantity: 4,
  flowStep: "direct-checkout" as const,
};

describe("business-flow-service", () => {
  beforeEach(() => {
    resetBusinessFlowState();
  });

  it("shows the vulnerable flow accepting excessive direct reservations", () => {
    const result = unsafeReserveSensitiveFlow(excessiveDirectReservation);

    expect(result.accepted).toBe(true);
    expect(result.reservedQuantity).toBe(4);
    expect(result.checks.flowOrderChecked).toBe(false);
    expect(result.checks.perUserLimitChecked).toBe(false);
  });

  it("rejects skipped workflow steps before quantity checks", () => {
    const result = safeReserveSensitiveFlow(excessiveDirectReservation);

    expect(result).toMatchObject({
      allowed: false,
      reason: "flow-order-violation",
      requiredStep: "cart-confirmed",
    });
  });

  it("rejects excessive quantities for sensitive business flows", () => {
    const result = safeReserveSensitiveFlow({
      ...excessiveDirectReservation,
      flowStep: "cart-confirmed",
    });

    expect(result).toMatchObject({
      allowed: false,
      reason: "per-user-limit-exceeded",
      maxPerUser: 1,
    });
  });

  it("allows a reservation when workflow and business limits are satisfied", () => {
    const result = safeReserveSensitiveFlow({
      userId: "user-demo-alice",
      productId: "product-demo-001",
      quantity: 1,
      flowStep: "cart-confirmed",
    });

    expect(result).toMatchObject({
      allowed: true,
      reservation: {
        reservedQuantity: 1,
        cumulativeReservedQuantity: 1,
        remainingStock: 2,
        controls: {
          flowOrderChecked: true,
          perUserLimitChecked: true,
          stockCheckedBeforeReservation: true,
          automationPatternChecked: true,
        },
      },
    });
  });

  it("rejects requests that exceed the cumulative per-user allowance", () => {
    const request = {
      userId: "user-demo-alice",
      productId: "product-demo-001",
      quantity: 1,
      flowStep: "cart-confirmed" as const,
    };

    expect(safeReserveSensitiveFlow(request).allowed).toBe(true);
    expect(safeReserveSensitiveFlow(request)).toMatchObject({
      allowed: false,
      reason: "per-user-limit-exceeded",
      alreadyReservedQuantity: 1,
      maxPerUser: 1,
    });
  });

  it("rejects reservations after cumulative stock is exhausted", () => {
    for (const userId of [
      "user-demo-alice",
      "user-demo-bob",
      "user-demo-reviewer",
    ]) {
      expect(
        safeReserveSensitiveFlow({
          userId,
          productId: "product-demo-001",
          quantity: 1,
          flowStep: "cart-confirmed",
        }).allowed,
      ).toBe(true);
    }

    expect(
      safeReserveSensitiveFlow({
        userId: "user-demo-admin",
        productId: "product-demo-001",
        quantity: 1,
        flowStep: "cart-confirmed",
      }),
    ).toMatchObject({
      allowed: false,
      reason: "stock-limit-exceeded",
      availableStock: 0,
    });
  });

  it("rejects automation after the bounded attempt window is exhausted", () => {
    const request = {
      userId: "user-demo-alice",
      productId: "product-demo-001",
      quantity: 1,
      flowStep: "direct-checkout" as const,
    };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(safeReserveSensitiveFlow(request, 1_000)).toMatchObject({
        reason: "flow-order-violation",
      });
    }

    expect(safeReserveSensitiveFlow(request, 1_000)).toMatchObject({
      allowed: false,
      reason: "automation-attempt-limit-exceeded",
      maxAttempts: 3,
      retryAfterMs: 60_000,
    });
  });
});
