import { describe, expect, it } from "vitest";
import {
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
        controls: {
          flowOrderChecked: true,
          perUserLimitChecked: true,
          stockCheckedBeforeReservation: true,
          automationPatternChecked: true,
        },
      },
    });
  });
});
