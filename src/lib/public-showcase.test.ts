import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { config, middleware } from "@/middleware";

const prefetchHeaderCases: Array<Record<string, string>> = [
  { "next-router-prefetch": "1" },
  { purpose: "prefetch" },
];

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
      expect(response.headers.get("Strict-Transport-Security")).toBe(
        "max-age=31536000",
      );
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
    const styleDirective = firstPolicy
      ?.split(";")
      .find((directive) => directive.trim().startsWith("style-src "));

    expect(firstResponse.headers.get("Cache-Control")).toBe("no-store");
    expect(firstResponse.headers.get("Strict-Transport-Security")).toBe(
      "max-age=31536000",
    );
    expect(firstNonce).toBeTruthy();
    expect(secondNonce).toBeTruthy();
    expect(firstNonce).not.toBe(secondNonce);
    expect(firstResponse.headers.get("x-middleware-request-x-nonce")).toBe(
      firstNonce,
    );
    expect(scriptDirective).toContain("'strict-dynamic'");
    expect(scriptDirective).not.toContain("'unsafe-inline'");
    expect(firstPolicy).toContain("script-src-attr 'none'");
    expect(styleDirective).toContain(`'nonce-${firstNonce}'`);
    expect(styleDirective).not.toContain("'unsafe-inline'");
    expect(firstPolicy).toContain("style-src-attr 'none'");
  });

  it("keeps development-only CSP allowances out of production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = middleware(new NextRequest("http://localhost/"));
    const policy = response.headers.get("Content-Security-Policy");

    expect(policy).toContain("script-src 'self'");
    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
    expect(policy).toContain("style-src-attr 'unsafe-inline'");
  });

  it("redirects non-loopback HTTP requests to HTTPS without sending HSTS over HTTP", () => {
    const response = middleware(
      new NextRequest("http://showcase.example/path?q=1"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("Location")).toBe(
      "https://showcase.example/path?q=1",
    );
    expect(response.headers.get("Strict-Transport-Security")).toBeNull();
  });

  it("applies transport security to static assets without disabling their cache policy", () => {
    const insecureResponse = middleware(
      new NextRequest("http://showcase.example/_next/static/app.js"),
    );
    const secureResponse = middleware(
      new NextRequest("https://showcase.example/_next/static/app.js"),
    );

    expect(insecureResponse.status).toBe(308);
    expect(secureResponse.headers.get("x-middleware-next")).toBe("1");
    expect(secureResponse.headers.get("Cache-Control")).toBeNull();
    expect(secureResponse.headers.get("Strict-Transport-Security")).toBe(
      "max-age=31536000",
    );
  });

  it.each(["http://localhost/", "http://127.0.0.1/", "http://[::1]/"])(
    "keeps loopback verification on HTTP without HSTS: %s",
    (url) => {
      const response = middleware(new NextRequest(url));

      expect(response.status).toBe(200);
      expect(response.headers.get("Strict-Transport-Security")).toBeNull();
    },
  );

  it.each(prefetchHeaderCases)(
    "keeps document prefetch requests inside the nonce boundary",
    (headers) => {
      expect(config.matcher).toBe("/:path*");

      const response = middleware(
        new NextRequest("https://showcase.example/", { headers }),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Security-Policy")).toContain(
        "'nonce-",
      );
      expect(response.headers.get("x-middleware-override-headers")).not.toMatch(
        /next-router-prefetch|purpose/,
      );
    },
  );
});
