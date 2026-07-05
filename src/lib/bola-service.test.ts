import { describe, expect, it } from "vitest";
import { getOrderByIdOnly, getOrderWithOwnershipCheck } from "./bola-service";

describe("BOLA order service", () => {
  it("returns an order by ID only for the vulnerable example", () => {
    const result = getOrderByIdOnly("order-demo-002");

    expect(result).toMatchObject({
      ok: true,
      order: {
        id: "order-demo-002",
        ownerId: "user-demo-bob",
      },
    });
  });

  it("rejects access when the secure example user does not own the order", () => {
    expect(
      getOrderWithOwnershipCheck("order-demo-002", "user-demo-alice"),
    ).toMatchObject({
      ok: false,
      reason: "forbidden",
    });
  });

  it("allows access when the secure example user owns the order", () => {
    expect(
      getOrderWithOwnershipCheck("order-demo-002", "user-demo-bob"),
    ).toMatchObject({
      ok: true,
      order: {
        id: "order-demo-002",
        ownerId: "user-demo-bob",
      },
    });
  });
});
