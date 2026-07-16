import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import ts from "typescript";

export type ApiRouteFamily = "secure" | "vulnerable";
export type HttpMethod =
  "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";

export type DiscoveredApiRoute = {
  file: string;
  methods: HttpMethod[];
  path: string;
  source: string;
};

const httpMethods = new Set<HttpMethod>([
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
]);

function httpMethod(name: string | undefined) {
  return name && httpMethods.has(name as HttpMethod)
    ? (name as HttpMethod)
    : undefined;
}

function hasExportModifier(node: ts.Node) {
  return (
    ts.canHaveModifiers(node) &&
    ts
      .getModifiers(node)
      ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
  );
}

export function exportedHttpMethods(file: string, source: string) {
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const methods = new Set<HttpMethod>();

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && hasExportModifier(statement)) {
      const method = httpMethod(statement.name?.text);
      if (method) {
        methods.add(method);
      }
      continue;
    }

    if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        const method = ts.isIdentifier(declaration.name)
          ? httpMethod(declaration.name.text)
          : undefined;
        if (method) {
          methods.add(method);
        }
      }
      continue;
    }

    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        const method = httpMethod(element.name.text);
        if (method) {
          methods.add(method);
        }
      }
    }
  }

  return [...methods].sort();
}

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

      return {
        file: relative(process.cwd(), file).replaceAll("\\", "/"),
        methods: exportedHttpMethods(file, source),
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
