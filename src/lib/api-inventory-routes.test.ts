import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as secureInventoryPost } from "@/app/api/secure/inventory/operations/route";
import { POST as vulnerableInventoryPost } from "@/app/api/vulnerable/inventory/operations/route";

const headers = { "Content-Type": "application/json" };
const body = JSON.stringify({
  endpointId: "legacy-token-reset-v1",
  requestedEnvironment: "production",
});

describe("API inventory demo routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("vulnerable route invokes a retired legacy operation preview", async () => {
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "test");

    const response = await vulnerableInventoryPost(
      new Request("http://localhost/api/vulnerable/inventory/operations", {
        method: "POST",
        headers,
        body,
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody.data.operation.invoked).toBe(true);
    expect(responseBody.data.operation.endpointState).toBe("retired");
  });

  it("secure route rejects retired operations from the inventory", async () => {
    const response = await secureInventoryPost(
      new Request("http://localhost/api/secure/inventory/operations", {
        method: "POST",
        headers,
        body,
      }),
    );
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody.error.details.reason).toBe("endpoint-not-active");
  });
});
