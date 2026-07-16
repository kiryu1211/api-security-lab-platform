import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

export type ApiRouteFamily = "secure" | "vulnerable";
export type HttpMethod =
  "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";

export type DiscoveredApiRoute = {
  file: string;
  methods: HttpMethod[];
  path: string;
  source: string;
};

const routeFunctionPattern =
  /export\s+(?:async\s+)?function\s+(DELETE|GET|HEAD|OPTIONS|PATCH|POST|PUT)\s*\(/g;
const routeConstantPattern =
  /export\s+const\s+(DELETE|GET|HEAD|OPTIONS|PATCH|POST|PUT)\s*=/g;

function findRouteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      return findRouteFiles(entryPath);
    }

    return entry.isFile() && entry.name === "route.ts" ? [entryPath] : [];
  });
}

function routePath(family: ApiRouteFamily, familyRoot: string, file: string) {
  const segments = relative(familyRoot, file)
    .replaceAll("\\", "/")
    .replace(/\/route\.ts$/, "")
    .split("/")
    .map((segment) => segment.replace(/^\[([^\]]+)\]$/, "{$1}"));

  return `/api/${family}/${segments.join("/")}`;
}

export function discoverApiRoutes(
  family: ApiRouteFamily,
): DiscoveredApiRoute[] {
  const familyRoot = resolve(process.cwd(), "src", "app", "api", family);

  return findRouteFiles(familyRoot)
    .map((file) => {
      const source = readFileSync(file, "utf8");
      const methods = new Set<HttpMethod>();

      for (const pattern of [routeFunctionPattern, routeConstantPattern]) {
        pattern.lastIndex = 0;
        for (const match of source.matchAll(pattern)) {
          methods.add(match[1] as HttpMethod);
        }
      }

      return {
        file: relative(process.cwd(), file).replaceAll("\\", "/"),
        methods: [...methods].sort(),
        path: routePath(family, familyRoot, file),
        source,
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
}

export function apiRouteOperations(family: ApiRouteFamily) {
  return discoverApiRoutes(family)
    .flatMap((route) =>
      route.methods.map((method) => `${method} ${route.path}`),
    )
    .sort();
}
