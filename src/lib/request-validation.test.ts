import { describe, expect, it } from "vitest";
import { secureRouteMeta } from "./api-response";
import { labSampleQuerySchema } from "./api-schemas";
import {
  MAX_JSON_BODY_BYTES,
  parseJsonRequest,
  searchParamsToObject,
  validateWithSchema,
} from "./request-validation";

describe("request validation", () => {
  it("accepts expected lab sample filters", () => {
    const value = searchParamsToObject(
      new URLSearchParams("userId=user-demo-alice&resourceType=order"),
    );

    expect(validateWithSchema(labSampleQuerySchema, value)).toMatchObject({
      ok: true,
      value: {
        userId: "user-demo-alice",
        resourceType: "order",
      },
    });
  });

  it("rejects unexpected lab sample filters", () => {
    const value = searchParamsToObject(
      new URLSearchParams("userId=real-user-1"),
    );

    expect(validateWithSchema(labSampleQuerySchema, value)).toMatchObject({
      ok: false,
    });
  });

  it("rejects duplicate security-sensitive query parameters", () => {
    const value = searchParamsToObject(
      new URLSearchParams("userId=user-demo-alice&userId=user-demo-bob"),
    );

    expect(validateWithSchema(labSampleQuerySchema, value)).toMatchObject({
      ok: false,
    });
  });

  it("accepts application/json with a charset", async () => {
    const result = await parseJsonRequest(
      new Request("http://localhost/api/secure/example", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ label: "demo" }),
      }),
      secureRouteMeta(),
    );

    expect(result).toEqual({ ok: true, value: { label: "demo" } });
  });

  it("returns a shared 415 error for a non-JSON content type", async () => {
    const result = await parseJsonRequest(
      new Request("http://localhost/api/secure/example", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "{}",
      }),
      secureRouteMeta(),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected JSON parsing to fail.");
    }

    expect(result.response.status).toBe(415);
    expect(result.response.headers.get("Cache-Control")).toBe("no-store");
    expect(result.response.headers.get("X-Content-Type-Options")).toBe(
      "nosniff",
    );
    await expect(result.response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "UNSUPPORTED_MEDIA_TYPE" },
      meta: { routeType: "secure" },
    });
  });

  it("rejects unsupported JSON charset declarations", async () => {
    const result = await parseJsonRequest(
      new Request("http://localhost/api/secure/example", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=shift_jis" },
        body: "{}",
      }),
      secureRouteMeta(),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected JSON parsing to fail.");
    }

    expect(result.response.status).toBe(415);
  });

  it.each([
    { name: "empty", body: undefined },
    { name: "malformed", body: '{"label":' },
  ])("returns a shared 400 error for $name JSON", async ({ body }) => {
    const result = await parseJsonRequest(
      new Request("http://localhost/api/secure/example", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
      secureRouteMeta(),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected JSON parsing to fail.");
    }

    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "INVALID_JSON" },
      meta: { routeType: "secure" },
    });
  });

  it("rejects a declared Content-Length over 16 KiB", async () => {
    const result = await parseJsonRequest(
      new Request("http://localhost/api/secure/example", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(MAX_JSON_BODY_BYTES + 1),
        },
        body: "{}",
      }),
      secureRouteMeta(),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected JSON parsing to fail.");
    }

    expect(result.response.status).toBe(413);
    await expect(result.response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "PAYLOAD_TOO_LARGE" },
      meta: { routeType: "secure" },
    });
  });

  it("rejects an actual UTF-8 body over 16 KiB", async () => {
    const result = await parseJsonRequest(
      new Request("http://localhost/api/secure/example", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: "\u3042".repeat(Math.floor(MAX_JSON_BODY_BYTES / 3)),
        }),
      }),
      secureRouteMeta(),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected JSON parsing to fail.");
    }

    expect(result.response.status).toBe(413);
    await expect(result.response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "PAYLOAD_TOO_LARGE" },
      meta: { routeType: "secure" },
    });
  });
});
