/// <reference types="vite/client" />

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_CORS_ALLOW_HEADERS,
  API_RESPONSE_SECURITY_HEADERS,
} from "./api-response";
import { resetBusinessFlowState } from "./business-flow-service";
import { resetRateLimitBuckets } from "./rate-limit-service";
import {
  discoverApiRoutes,
  type ApiRouteFamily,
  type DiscoveredApiRoute,
  type HttpMethod,
} from "@/test-utils/route-inventory";

type RouteContext = {
  params: Promise<Record<string, string | string[]>>;
};
type RouteHandler = (
  request: Request,
  context: RouteContext,
) => Response | Promise<Response>;
type RouteModule = Partial<Record<HttpMethod, RouteHandler>>;
type RouteOperation = {
  family: ApiRouteFamily;
  method: HttpMethod;
  route: DiscoveredApiRoute;
};
type SuccessFixture = {
  body?: unknown;
  pathParams?: Record<string, string>;
  query?: (family: ApiRouteFamily) => string;
};

const routeModuleLoaders = import.meta.glob<RouteModule>(
  "../app/api/**/route.ts",
);
const routeOperations = (["secure", "vulnerable"] as const).flatMap((family) =>
  discoverApiRoutes(family).flatMap((route) =>
    route.methods.map((method) => ({ family, method, route })),
  ),
);
const successFixtures: Record<string, SuccessFixture> = {
  "GET /api/{family}/health": {},
  "GET /api/{family}/lab-samples": {
    query: () => "userId=user-demo-alice&resourceType=order",
  },
  "GET /api/{family}/orders/{orderId}": {
    pathParams: { orderId: "order-demo-001" },
    query: (family) => (family === "secure" ? "userId=user-demo-alice" : ""),
  },
  "POST /api/{family}/auth/session": {
    body: {
      tokenId: "demo-token-valid-reader",
      requiredPermission: "orders:read",
    },
  },
  "GET /api/{family}/rate-limit/search": {
    query: () => "userId=user-demo-alice&q=demo",
  },
  "POST /api/{family}/admin/invitations": {
    body: {
      actorUserId: "user-demo-admin",
      targetEmailAlias: "analyst.demo",
      requestedRole: "admin",
    },
  },
  "PATCH /api/{family}/profile": {
    body: { displayLabel: "Header verification", notificationsEnabled: true },
  },
  "POST /api/{family}/business-flow/reservations": {
    body: {
      userId: "user-demo-alice",
      productId: "product-demo-001",
      quantity: 1,
      flowStep: "cart-confirmed",
    },
  },
  "POST /api/{family}/fetch-url": {
    body: { url: "https://api.example.test/resource" },
  },
  "POST /api/{family}/config/diagnostics": {
    body: {
      requestedOrigin: "https://untrusted.example",
      includeDebugDetails: true,
    },
  },
  "POST /api/{family}/third-party/profile-import": {
    body: {
      providerResponseId: "partner-response-safe-profile",
      expectedProvider: "trusted-profile-service",
    },
  },
  "POST /api/{family}/inventory/operations": {
    body: {
      endpointId: "current-token-reset-v2",
      requestedEnvironment: "production",
    },
  },
};

function operationKey(operation: RouteOperation) {
  return `${operation.method} ${operation.route.path.replace(
    `/api/${operation.family}/`,
    "/api/{family}/",
  )}`;
}

async function invokeRoute(operation: RouteOperation) {
  const fixture = successFixtures[operationKey(operation)];
  if (!fixture) {
    throw new Error(`Success fixture is missing: ${operationKey(operation)}`);
  }

  const modulePath = operation.route.file.replace(/^src\/app\//, "../app/");
  const loadModule = routeModuleLoaders[modulePath];
  if (!loadModule) {
    throw new Error(`Route module is not available: ${modulePath}`);
  }
  const handler = (await loadModule())[operation.method];
  if (!handler) {
    throw new Error(
      `Route handler is not exported: ${operationKey(operation)}`,
    );
  }

  const params: Record<string, string | string[]> = {};
  const path = operation.route.path.replace(
    /\{([^}]+)\}/g,
    (_, parameter: string) => {
      const value = fixture.pathParams?.[parameter] ?? "header-test";
      params[parameter] = value;
      return value;
    },
  );
  const query = fixture.query?.(operation.family);
  const init: RequestInit = { method: operation.method };
  if (fixture.body !== undefined) {
    init.body = JSON.stringify(fixture.body);
    init.headers = { "Content-Type": "application/json" };
  }

  return handler(
    new Request(`http://localhost${path}${query ? `?${query}` : ""}`, init),
    { params: Promise.resolve(params) },
  );
}

function expectCommonApiHeaders(response: Response, operation: RouteOperation) {
  expect(
    response.headers.get("Content-Type"),
    operationKey(operation),
  ).toContain("application/json");
  for (const [name, value] of Object.entries(API_RESPONSE_SECURITY_HEADERS)) {
    expect(response.headers.get(name), operationKey(operation)).toBe(value);
  }
  for (const name of API_CORS_ALLOW_HEADERS) {
    expect(response.headers.get(name), operationKey(operation)).toBeNull();
  }
}

describe("API response headers across Route Handlers", () => {
  beforeEach(() => {
    resetBusinessFlowState();
    resetRateLimitBuckets();
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("PUBLIC_SHOWCASE", "false");
  });

  afterEach(() => {
    resetBusinessFlowState();
    resetRateLimitBuckets();
    vi.unstubAllEnvs();
  });

  it("keeps success fixtures aligned with the route inventory", () => {
    expect([...new Set(routeOperations.map(operationKey))].sort()).toEqual(
      Object.keys(successFixtures).sort(),
    );
  });

  it.each(routeOperations)(
    "$method $route.path returns a protected JSON success response",
    async (operation) => {
      const response = await invokeRoute(operation);
      const body = await response.json();

      expect(response.status, operationKey(operation)).toBe(200);
      expectCommonApiHeaders(response, operation);
      expect(body, operationKey(operation)).toMatchObject({
        ok: true,
        meta:
          operation.family === "vulnerable"
            ? { routeType: "vulnerable", localOnly: true }
            : { routeType: "secure" },
      });
    },
  );
});
