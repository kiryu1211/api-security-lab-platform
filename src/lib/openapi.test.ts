import { describe, expect, it } from "vitest";
import openApiSpec from "../../docs/api/openapi.json";

describe("OpenAPI specification", () => {
  it("documents separated secure and vulnerable support routes", () => {
    expect(openApiSpec.paths).toHaveProperty("/api/secure/health");
    expect(openApiSpec.paths).toHaveProperty("/api/vulnerable/health");
    expect(openApiSpec.paths).toHaveProperty("/api/secure/lab-samples");
    expect(openApiSpec.paths).toHaveProperty("/api/vulnerable/lab-samples");
    expect(openApiSpec.paths).toHaveProperty("/api/secure/orders/{orderId}");
    expect(openApiSpec.paths).toHaveProperty(
      "/api/vulnerable/orders/{orderId}",
    );
  });

  it("describes vulnerable routes as local-only", () => {
    expect(openApiSpec.info.description).toContain(
      "Vulnerable routes are local-only",
    );
    expect(
      openApiSpec.tags.find((tag) => tag.name === "vulnerable")?.description,
    ).toContain("Local-only");
  });
});
