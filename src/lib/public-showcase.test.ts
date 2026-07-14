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
});
