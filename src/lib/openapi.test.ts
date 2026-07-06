import { describe, expect, it } from "vitest";
import openApiSpec from "../../docs/api/openapi.json";

type OpenApiOperation = {
  summary?: string;
  description?: string;
  parameters?: Array<{ $ref: string }>;
  responses: Record<string, { description?: string }>;
};

type OpenApiPathItem = Record<string, OpenApiOperation>;

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
    expect(openApiSpec.paths).toHaveProperty("/api/secure/auth/session");
    expect(openApiSpec.paths).toHaveProperty("/api/vulnerable/auth/session");
    expect(openApiSpec.paths).toHaveProperty("/api/secure/rate-limit/search");
    expect(openApiSpec.paths).toHaveProperty(
      "/api/vulnerable/rate-limit/search",
    );
    expect(openApiSpec.paths).toHaveProperty("/api/secure/profile");
    expect(openApiSpec.paths).toHaveProperty("/api/vulnerable/profile");
    expect(openApiSpec.paths).toHaveProperty("/api/secure/fetch-url");
    expect(openApiSpec.paths).toHaveProperty("/api/vulnerable/fetch-url");
  });

  it("describes vulnerable routes as local-only", () => {
    expect(openApiSpec.info.description).toContain(
      "Vulnerable routes are local-only",
    );
    expect(
      openApiSpec.tags.find((tag) => tag.name === "vulnerable")?.description,
    ).toContain("Local-only");
  });

  it("marks every vulnerable operation with local-only wording and disabled responses", () => {
    const paths = openApiSpec.paths as Record<string, OpenApiPathItem>;
    const vulnerableOperations = Object.entries(paths).flatMap(
      ([path, pathItem]) =>
        path.startsWith("/api/vulnerable/")
          ? Object.entries(pathItem).map(([method, operation]) => ({
              method,
              operation,
              path,
            }))
          : [],
    );

    expect(vulnerableOperations.length).toBeGreaterThan(0);

    for (const { method, operation, path } of vulnerableOperations) {
      const searchableText = [operation.summary, operation.description]
        .filter(Boolean)
        .join(" ");

      expect(searchableText, `${method.toUpperCase()} ${path}`).toMatch(
        /local-only/i,
      );
      expect(
        operation.responses["403"]?.description,
        `${method.toUpperCase()} ${path}`,
      ).toMatch(/disabled outside local non-production mode/i);
    }
  });

  it("documents rate-limit query parameters used by the route handlers", () => {
    const paths = openApiSpec.paths as Record<string, OpenApiPathItem>;

    for (const path of [
      "/api/vulnerable/rate-limit/search",
      "/api/secure/rate-limit/search",
    ]) {
      const parameters = paths[path].get.parameters ?? [];

      expect(parameters).toEqual(
        expect.arrayContaining([
          { $ref: "#/components/parameters/UserId" },
          { $ref: "#/components/parameters/SearchQuery" },
        ]),
      );
    }
  });
});
