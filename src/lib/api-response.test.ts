import { describe, expect, it } from "vitest";
import {
  API_CORS_ALLOW_HEADERS,
  API_RESPONSE_SECURITY_HEADERS,
  apiError,
  apiSuccess,
  secureRouteMeta,
} from "./api-response";

const unsafeHeaders = {
  ...Object.fromEntries(
    Object.keys(API_RESPONSE_SECURITY_HEADERS).map((name) => [name, "unsafe"]),
  ),
  ...Object.fromEntries(API_CORS_ALLOW_HEADERS.map((name) => [name, "unsafe"])),
  "X-Demo-Header": "preserved",
};

describe("API response security headers", () => {
  it.each([
    {
      name: "success",
      response: () =>
        apiSuccess({ verified: true }, secureRouteMeta(), {
          headers: unsafeHeaders,
        }),
    },
    {
      name: "error",
      response: () =>
        apiError(
          403,
          "FORBIDDEN",
          "Synthetic test rejection.",
          secureRouteMeta(),
          undefined,
          { headers: unsafeHeaders },
        ),
    },
  ])("enforces the shared contract for $name responses", ({ response }) => {
    const result = response();

    for (const [name, value] of Object.entries(API_RESPONSE_SECURITY_HEADERS)) {
      expect(result.headers.get(name)).toBe(value);
    }
    for (const name of API_CORS_ALLOW_HEADERS) {
      expect(result.headers.get(name)).toBeNull();
    }
    expect(result.headers.get("X-Demo-Header")).toBe("preserved");
  });
});
