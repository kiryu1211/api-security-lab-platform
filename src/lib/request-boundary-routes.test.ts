/// <reference types="vite/client" />

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetBusinessFlowState } from "./business-flow-service";
import { MAX_JSON_BODY_BYTES } from "./request-validation";
import {
  discoverApiRoutes,
  type ApiRouteFamily,
  type DiscoveredApiRoute,
} from "@/test-utils/route-inventory";

type BodyMethod = "PATCH" | "POST";
type RouteContext = {
  params: Promise<Record<string, string | string[]>>;
};
type RouteHandler = (
  request: Request,
  context: RouteContext,
) => Response | Promise<Response>;
type RouteModule = Partial<Record<BodyMethod, RouteHandler>>;
type BodyOperation = {
  family: ApiRouteFamily;
  method: BodyMethod;
  route: DiscoveredApiRoute;
};

const routeModuleLoaders = import.meta.glob<RouteModule>(
  "../app/api/**/route.ts",
);
const bodyOperations = (["secure", "vulnerable"] as const).flatMap((family) =>
  discoverApiRoutes(family).flatMap((route) =>
    route.methods
      .filter((method): method is BodyMethod =>
        ["PATCH", "POST"].includes(method),
      )
      .map((method) => ({ family, method, route })),
  ),
);
const exactLimitBody = `{"value":"${"a".repeat(MAX_JSON_BODY_BYTES - 12)}"}`;

function requestTarget(routePath: string) {
  const params: Record<string, string | string[]> = {};
  const path = routePath.replace(/\{([^}]+)\}/g, (_, parameter: string) => {
    const catchAll = parameter.startsWith("...");
    const name = catchAll ? parameter.slice(3) : parameter;
    params[name] = catchAll ? ["boundary-test"] : "boundary-test";
    return "boundary-test";
  });

  return {
    context: { params: Promise.resolve(params) },
    url: `http://localhost${path}`,
  };
}

async function loadHandler(operation: BodyOperation) {
  const modulePath = operation.route.file.replace(/^src\/app\//, "../app/");
  const loadModule = routeModuleLoaders[modulePath];
  if (!loadModule) {
    throw new Error(`Route module is not available: ${modulePath}`);
  }

  const handler = (await loadModule())[operation.method];
  if (!handler) {
    throw new Error(
      `Route handler is not exported: ${operation.method} ${operation.route.path}`,
    );
  }

  return handler;
}

async function invokeRoute(operation: BodyOperation, init: RequestInit) {
  const handler = await loadHandler(operation);
  const target = requestTarget(operation.route.path);

  return handler(
    new Request(target.url, { ...init, method: operation.method }),
    target.context,
  );
}

async function expectBoundaryError(
  response: Response,
  operation: BodyOperation,
  status: number,
  code: "PAYLOAD_TOO_LARGE" | "UNSUPPORTED_MEDIA_TYPE",
) {
  expect(response.status).toBe(status);
  expect(response.headers.get("Content-Type")).toContain("application/json");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  await expect(response.json()).resolves.toMatchObject({
    ok: false,
    error: { code },
    meta:
      operation.family === "vulnerable"
        ? { routeType: "vulnerable", localOnly: true }
        : { routeType: "secure" },
  });
}

async function expectAcceptedForSchemaValidation(
  response: Response,
  operation: BodyOperation,
) {
  expect(response.status).not.toBe(413);
  expect(response.headers.get("Content-Type")).toContain("application/json");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  const body = await response.json();

  expect(body).toMatchObject({
    meta:
      operation.family === "vulnerable"
        ? { routeType: "vulnerable", localOnly: true }
        : { routeType: "secure" },
  });
  expect(body).not.toMatchObject({
    error: { code: "PAYLOAD_TOO_LARGE" },
  });
}

describe("Route Handler request boundaries", () => {
  beforeEach(() => {
    resetBusinessFlowState();
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("PUBLIC_SHOWCASE", "false");
  });

  afterEach(() => {
    resetBusinessFlowState();
    vi.unstubAllEnvs();
  });

  it("matches every dynamically exported POST and PATCH handler", async () => {
    const dynamicallyExportedOperations: string[] = [];

    for (const [modulePath, loadModule] of Object.entries(routeModuleLoaders)) {
      const routeModule = await loadModule();
      const file = modulePath.replace(/^\.\.\/app\//, "src/app/");

      for (const method of ["PATCH", "POST"] as const) {
        if (typeof routeModule[method] === "function") {
          dynamicallyExportedOperations.push(`${method} ${file}`);
        }
      }
    }

    expect(dynamicallyExportedOperations.sort()).toEqual(
      bodyOperations
        .map((operation) => `${operation.method} ${operation.route.file}`)
        .sort(),
    );
  });

  it.each(bodyOperations)(
    "$method $route.path rejects unsupported content types",
    async (operation) => {
      const response = await invokeRoute(operation, {
        body: "{}",
        headers: { "Content-Type": "text/plain" },
      });

      await expectBoundaryError(
        response,
        operation,
        415,
        "UNSUPPORTED_MEDIA_TYPE",
      );
    },
  );

  it.each(bodyOperations)(
    "$method $route.path rejects an oversized declared length",
    async (operation) => {
      const response = await invokeRoute(operation, {
        body: "{}",
        headers: {
          "Content-Length": String(MAX_JSON_BODY_BYTES + 1),
          "Content-Type": "application/json",
        },
      });

      await expectBoundaryError(response, operation, 413, "PAYLOAD_TOO_LARGE");
    },
  );

  it.each(bodyOperations)(
    "$method $route.path accepts exactly 16 KiB for schema validation",
    async (operation) => {
      expect(new TextEncoder().encode(exactLimitBody)).toHaveLength(
        MAX_JSON_BODY_BYTES,
      );
      const response = await invokeRoute(operation, {
        body: exactLimitBody,
        headers: {
          "Content-Length": String(MAX_JSON_BODY_BYTES),
          "Content-Type": "application/json",
        },
      });

      await expectAcceptedForSchemaValidation(response, operation);
    },
  );

  it.each(bodyOperations)(
    "$method $route.path rejects an oversized actual body",
    async (operation) => {
      const response = await invokeRoute(operation, {
        body: JSON.stringify({ value: "a".repeat(MAX_JSON_BODY_BYTES + 1) }),
        headers: { "Content-Type": "application/json" },
      });

      await expectBoundaryError(response, operation, 413, "PAYLOAD_TOO_LARGE");
    },
  );
});
