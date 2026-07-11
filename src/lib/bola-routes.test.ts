import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as secureOrderGet } from "@/app/api/secure/orders/[orderId]/route";
import { GET as vulnerableOrderGet } from "@/app/api/vulnerable/orders/[orderId]/route";

describe("BOLA order routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("vulnerable route returns another user's order in local mode", async () => {
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "test");

    const response = await vulnerableOrderGet(
      new Request("http://localhost/api/vulnerable/orders/order-demo-002"),
      {
        params: Promise.resolve({ orderId: "order-demo-002" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      data: {
        order: {
          id: "order-demo-002",
          ownerId: "user-demo-bob",
        },
      },
      meta: {
        routeType: "vulnerable",
        localOnly: true,
      },
    });
  });

  it("secure route rejects a user who does not own the order", async () => {
    const response = await secureOrderGet(
      new Request(
        "http://localhost/api/secure/orders/order-demo-002?userId=user-demo-alice",
      ),
      {
        params: Promise.resolve({ orderId: "order-demo-002" }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "FORBIDDEN",
      },
      meta: {
        routeType: "secure",
      },
    });
  });
});
