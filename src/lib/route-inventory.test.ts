import { describe, expect, it } from "vitest";
import {
  apiRouteOperations,
  discoverApiRoutes,
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
});
