import { describe, expect, it } from "vitest";
import { labResources, labUsers } from "@/data/lab-samples";
import { listLabSamples } from "./lab-sample-service";

describe("lab sample service", () => {
  it("uses local-only demo identifiers instead of real personal data", () => {
    expect(labUsers.every((user) => user.id.startsWith("user-demo-"))).toBe(
      true,
    );
    expect(
      labResources.every((resource) => resource.id.includes("-demo-")),
    ).toBe(true);
  });

  it("filters resources by owner and type", () => {
    const samples = listLabSamples({
      userId: "user-demo-bob",
      resourceType: "order",
    });

    expect(samples.resources).toHaveLength(1);
    expect(samples.resources[0]).toMatchObject({
      id: "order-demo-002",
      ownerId: "user-demo-bob",
      resourceType: "order",
    });
  });
});
