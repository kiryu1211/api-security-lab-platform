import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as secureReservationPost } from "@/app/api/secure/business-flow/reservations/route";
import { POST as vulnerableReservationPost } from "@/app/api/vulnerable/business-flow/reservations/route";
import { resetBusinessFlowState } from "./business-flow-service";

const headers = { "Content-Type": "application/json" };
const body = JSON.stringify({
  userId: "user-demo-alice",
  productId: "product-demo-001",
  quantity: 4,
  flowStep: "direct-checkout",
});

describe("business flow demo routes", () => {
  beforeEach(() => {
    resetBusinessFlowState();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("vulnerable route accepts excessive sensitive-flow reservations", async () => {
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "test");

    const response = await vulnerableReservationPost(
      new Request(
        "http://localhost/api/vulnerable/business-flow/reservations",
        {
          method: "POST",
          headers,
          body,
        },
      ),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.data.reservation.accepted).toBe(true);
    expect(responseBody.data.reservation.reservedQuantity).toBe(4);
  });

  it("secure route rejects skipped workflow and excessive reservation requests", async () => {
    const response = await secureReservationPost(
      new Request("http://localhost/api/secure/business-flow/reservations", {
        method: "POST",
        headers,
        body,
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody.error.details.reason).toBe("flow-order-violation");
  });

  it("secure route rejects repeated reservations above the cumulative allowance", async () => {
    const request = () =>
      secureReservationPost(
        new Request("http://localhost/api/secure/business-flow/reservations", {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: "user-demo-alice",
            productId: "product-demo-001",
            quantity: 1,
            flowStep: "cart-confirmed",
          }),
        }),
      );

    expect((await request()).status).toBe(200);
    const repeated = await request();
    const responseBody = await repeated.json();

    expect(repeated.status).toBe(403);
    expect(responseBody.error.details).toMatchObject({
      reason: "per-user-limit-exceeded",
      alreadyReservedQuantity: 1,
    });
  });
});
