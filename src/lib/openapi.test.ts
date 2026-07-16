import { describe, expect, it } from "vitest";
import { learningModules } from "@/data/learning-modules";
import {
  apiRouteOperations,
  type ApiRouteFamily,
} from "@/test-utils/route-inventory";
import openApiSpec from "../../docs/api/openapi.json";

type OpenApiOperation = {
  summary?: string;
  description?: string;
  parameters?: Array<{ $ref: string }>;
  requestBody?: { $ref?: string };
  responses: Record<
    string,
    {
      $ref?: string;
      description?: string;
      headers?: Record<string, { $ref?: string }>;
    }
  >;
};

type OpenApiPathItem = Record<string, OpenApiOperation>;

type OpenApiObjectSchema = {
  additionalProperties?: boolean;
  properties?: Record<
    string,
    {
      enum?: string[];
      maxLength?: number;
      minLength?: number;
      type?: string;
    }
  >;
};

const knownDemoUserIds = [
  "user-demo-alice",
  "user-demo-bob",
  "user-demo-reviewer",
  "user-demo-admin",
];
const openApiHttpMethods = new Set([
  "delete",
  "get",
  "head",
  "options",
  "patch",
  "post",
  "put",
]);

function documentedApiOperations(family: ApiRouteFamily) {
  const paths = openApiSpec.paths as Record<string, OpenApiPathItem>;

  return Object.entries(paths)
    .flatMap(([path, pathItem]) =>
      path.startsWith(`/api/${family}/`)
        ? Object.keys(pathItem)
            .filter((method) => openApiHttpMethods.has(method))
            .map((method) => `${method.toUpperCase()} ${path}`)
        : [],
    )
    .sort();
}

describe("OpenAPI specification", () => {
  it("documents every implemented secure and vulnerable operation", () => {
    for (const family of ["secure", "vulnerable"] as const) {
      expect(documentedApiOperations(family)).toEqual(
        apiRouteOperations(family),
      );
    }
  });

  it("documents every ready learning module route", () => {
    for (const learningModule of learningModules) {
      expect(openApiSpec.paths).toHaveProperty(learningModule.vulnerable.route);
      expect(openApiSpec.paths).toHaveProperty(learningModule.secure.route);
    }
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

  it("documents shared JSON request boundary errors", () => {
    expect(openApiSpec.components.responses).toHaveProperty("PayloadTooLarge");
    expect(openApiSpec.components.responses).toHaveProperty(
      "UnsupportedMediaType",
    );

    for (const requestBody of Object.values(
      openApiSpec.components.requestBodies,
    )) {
      expect(requestBody.description).toContain("16 KiB");
      expect(requestBody.description).toContain("415");
    }
  });

  it("references shared boundary errors from every body-bearing operation", () => {
    const paths = openApiSpec.paths as Record<string, OpenApiPathItem>;
    const bodyBearingOperations = Object.entries(paths).flatMap(
      ([path, pathItem]) =>
        Object.entries(pathItem)
          .filter(([, operation]) => operation.requestBody)
          .map(([method, operation]) => ({ method, operation, path })),
    );

    expect(bodyBearingOperations.length).toBeGreaterThan(0);

    for (const { method, operation, path } of bodyBearingOperations) {
      const operationName = `${method.toUpperCase()} ${path}`;

      expect(["post", "patch"], operationName).toContain(method);
      expect(operation.responses["413"], operationName).toEqual({
        $ref: "#/components/responses/PayloadTooLarge",
      });
      expect(operation.responses["415"], operationName).toEqual({
        $ref: "#/components/responses/UnsupportedMediaType",
      });
    }
  });

  it("marks request schemas as strict when their runtime Zod schemas are strict", () => {
    const schemas = openApiSpec.components.schemas as Record<
      string,
      OpenApiObjectSchema
    >;
    const strictRequestSchemas = [
      "AuthSessionRequest",
      "AdminInvitationRequest",
      "FetchUrlRequest",
      "SecurityConfigAuditRequest",
      "BusinessFlowReservationRequest",
      "ThirdPartyProfileImportRequest",
      "ApiInventoryOperationRequest",
    ];

    for (const schemaName of strictRequestSchemas) {
      expect(schemas[schemaName].additionalProperties, schemaName).toBe(false);
    }

    expect(schemas.ProfileUpdateRequest.additionalProperties).toBeUndefined();
    expect(
      Object.keys(schemas.ProfileUpdateRequest.properties ?? {}).sort(),
    ).toEqual(["displayLabel", "notificationsEnabled", "ownerId", "role"]);
    expect(schemas.ProfileUpdateRequest.properties?.displayLabel).toMatchObject(
      {
        type: "string",
        minLength: 1,
        maxLength: 80,
      },
    );
  });

  it("uses the runtime demo user enum and string bounds everywhere they apply", () => {
    const schemas = openApiSpec.components.schemas as Record<
      string,
      OpenApiObjectSchema
    >;

    expect(openApiSpec.components.parameters.UserId.schema.enum).toEqual(
      knownDemoUserIds,
    );
    expect(
      openApiSpec.components.parameters.UserIdRequired.schema.enum,
    ).toEqual(knownDemoUserIds);
    expect(
      schemas.AdminInvitationRequest.properties?.actorUserId?.enum,
    ).toEqual(knownDemoUserIds);
    expect(schemas.ProfileUpdateRequest.properties?.ownerId?.enum).toEqual(
      knownDemoUserIds,
    );
    expect(
      schemas.BusinessFlowReservationRequest.properties?.userId?.enum,
    ).toEqual(knownDemoUserIds);
    expect(openApiSpec.components.parameters.SearchQuery.schema).toMatchObject({
      minLength: 1,
      maxLength: 40,
    });
  });

  it("documents operation-specific response headers", () => {
    const paths = openApiSpec.paths as Record<string, OpenApiPathItem>;
    const rateLimitResponses =
      paths["/api/secure/rate-limit/search"].get.responses;

    expect(Object.keys(rateLimitResponses["200"].headers ?? {})).toEqual([
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
    ]);
    expect(rateLimitResponses["429"].headers?.["Retry-After"]).toEqual({
      $ref: "#/components/headers/RetryAfter",
    });

    const diagnosticsResponses =
      paths["/api/secure/config/diagnostics"].post.responses;
    for (const status of ["200", "403"]) {
      expect(diagnosticsResponses[status].headers?.["Vary"]).toEqual({
        $ref: "#/components/headers/VaryOrigin",
      });
    }
  });
});
