import { describe, expect, it } from "vitest";
import {
  apiRouteOperations,
  discoverApiRoutes,
  exportedHttpMethods,
} from "@/test-utils/route-inventory";

describe("API Route Handler inventory", () => {
  it("keeps secure and vulnerable operations structurally paired", () => {
    const secureOperations = apiRouteOperations("secure").map((operation) =>
      operation.replace("/api/secure/", "/api/{family}/"),
    );
    const vulnerableOperations = apiRouteOperations("vulnerable").map(
      (operation) => operation.replace("/api/vulnerable/", "/api/{family}/"),
    );

    expect(vulnerableOperations).toEqual(secureOperations);
  });

  it("finds at least one exported HTTP method in every route file", () => {
    for (const family of ["secure", "vulnerable"] as const) {
      for (const route of discoverApiRoutes(family)) {
        expect(route.methods.length, route.file).toBeGreaterThan(0);
      }
    }
  });

  it("discovers function, typed variable, and named re-export methods", () => {
    expect(
      exportedHttpMethods(
        "route.ts",
        `
          export async function GET() {}
          export const POST: (request: Request) => Promise<Response> = async () => new Response();
          const update = () => new Response();
          const DELETE = () => new Response();
          export { update as PATCH };
        `,
      ),
    ).toEqual(["GET", "PATCH", "POST"]);
  });

  it("applies the local-only guard once per vulnerable operation", () => {
    for (const route of discoverApiRoutes("vulnerable")) {
      expect(route.source, route.file).toContain(
        'import { assertVulnerableApisEnabled } from "@/lib/env";',
      );
      expect(
        route.source.match(
          /assertVulnerableApisEnabled\s*\(\s*request\s*\)/g,
        ) ?? [],
        route.file,
      ).toHaveLength(route.methods.length);
    }
  });

  it("does not mix the vulnerable guard into secure route files", () => {
    for (const route of discoverApiRoutes("secure")) {
      expect(route.source, route.file).not.toContain(
        "assertVulnerableApisEnabled",
      );
    }
  });

  it("applies shared JSON parsing once per body-bearing operation", () => {
    for (const family of ["secure", "vulnerable"] as const) {
      for (const route of discoverApiRoutes(family)) {
        const bodyMethods = route.methods.filter(
          (method) => method === "PATCH" || method === "POST",
        );
        if (bodyMethods.length === 0) {
          continue;
        }

        expect(route.source, route.file).toMatch(
          /import\s*\{[^}]*\bparseJsonRequest\b[^}]*\}\s*from\s*["']@\/lib\/request-validation["'];/,
        );
        expect(
          route.source.match(
            /parseJsonRequest\s*\(\s*request\s*,\s*meta\s*\)/g,
          ) ?? [],
          route.file,
        ).toHaveLength(bodyMethods.length);
      }
    }
  });
});
