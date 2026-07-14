import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("public showcase boundary", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(["secure", "vulnerable"])(
    "rejects %s API execution before route handling",
    async (routeType) => {
      vi.stubEnv("PUBLIC_SHOWCASE", "true");
      const response = middleware(
        new NextRequest(`https://showcase.example/api/${routeType}/health`),
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(response.headers.get("Content-Security-Policy")).toBe(
        "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      );
      expect(body).toMatchObject({
        ok: false,
        error: { code: "PUBLIC_SHOWCASE_API_DISABLED" },
        meta: { routeType },
      });
    },
  );

  it("allows API routing outside public showcase mode", () => {
    vi.stubEnv("PUBLIC_SHOWCASE", "false");
    const response = middleware(
      new NextRequest("http://localhost/api/secure/health"),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("rejects the API root in public showcase mode", async () => {
    vi.stubEnv("PUBLIC_SHOWCASE", "true");
    const response = middleware(
      new NextRequest("https://showcase.example/api"),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe("PUBLIC_SHOWCASE_API_DISABLED");
  });

  it("generates a fresh nonce CSP for each document request", () => {
    const firstResponse = middleware(
      new NextRequest("https://showcase.example/"),
    );
    const secondResponse = middleware(
      new NextRequest("https://showcase.example/"),
    );
    const firstPolicy = firstResponse.headers.get("Content-Security-Policy");
    const secondPolicy = secondResponse.headers.get("Content-Security-Policy");
    const firstNonce = firstPolicy?.match(/'nonce-([^']+)'/)?.[1];
    const secondNonce = secondPolicy?.match(/'nonce-([^']+)'/)?.[1];
    const scriptDirective = firstPolicy
      ?.split(";")
      .find((directive) => directive.trim().startsWith("script-src "));

    expect(firstResponse.headers.get("Cache-Control")).toBe("no-store");
    expect(firstNonce).toBeTruthy();
    expect(secondNonce).toBeTruthy();
    expect(firstNonce).not.toBe(secondNonce);
    expect(firstResponse.headers.get("x-middleware-request-x-nonce")).toBe(
      firstNonce,
    );
    expect(scriptDirective).toContain("'strict-dynamic'");
    expect(scriptDirective).not.toContain("'unsafe-inline'");
    expect(firstPolicy).toContain("script-src-attr 'none'");
    expect(firstPolicy).toContain("style-src 'self' 'unsafe-inline'");
  });
});
