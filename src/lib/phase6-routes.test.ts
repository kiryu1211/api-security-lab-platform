import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as secureRateLimitGet } from "@/app/api/secure/rate-limit/search/route";
import { PATCH as secureProfilePatch } from "@/app/api/secure/profile/route";
import { POST as secureFetchUrlPost } from "@/app/api/secure/fetch-url/route";
import { GET as vulnerableRateLimitGet } from "@/app/api/vulnerable/rate-limit/search/route";
import { PATCH as vulnerableProfilePatch } from "@/app/api/vulnerable/profile/route";
import { POST as vulnerableFetchUrlPost } from "@/app/api/vulnerable/fetch-url/route";
import { resetRateLimitBuckets } from "./rate-limit-service";

const jsonHeaders = { "Content-Type": "application/json" };

describe("phase 6 demo routes", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("vulnerable rate-limit route does not apply limits", async () => {
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "test");

    const response = await vulnerableRateLimitGet(
      new Request(
        "http://localhost/api/vulnerable/rate-limit/search?userId=user-demo-alice&q=demo",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.result.limitApplied).toBe(false);
  });

  it("secure rate-limit route returns 429 after repeated requests", async () => {
    const request = () =>
      secureRateLimitGet(
        new Request(
          "http://localhost/api/secure/rate-limit/search?userId=user-demo-alice&q=demo",
        ),
      );

    await request();
    await request();
    await request();
    const blocked = await request();

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
    expect(blocked.headers.get("RateLimit-Limit")).toBe("3");
    expect(blocked.headers.get("RateLimit-Remaining")).toBe("0");
    expect(blocked.headers.get("RateLimit-Reset")).toMatch(/^\d+$/);

    const body = await blocked.json();
    expect(body.error.details).not.toHaveProperty("key");
  });

  it("rejects unknown demo user IDs but accepts the known admin identity", async () => {
    const unknown = await secureRateLimitGet(
      new Request(
        "http://localhost/api/secure/rate-limit/search?userId=user-demo-mallory&q=demo",
      ),
    );
    const admin = await secureRateLimitGet(
      new Request(
        "http://localhost/api/secure/rate-limit/search?userId=user-demo-admin&q=demo",
      ),
    );

    expect(unknown.status).toBe(400);
    expect(admin.status).toBe(200);
  });

  it("vulnerable profile route applies mass assignment fields", async () => {
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "test");

    const response = await vulnerableProfilePatch(
      new Request("http://localhost/api/vulnerable/profile", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ ownerId: "user-demo-bob", role: "reviewer" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.profile.ownerId).toBe("user-demo-bob");
  });

  it("secure profile route rejects mass assignment fields", async () => {
    const response = await secureProfilePatch(
      new Request("http://localhost/api/secure/profile", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ ownerId: "user-demo-bob", role: "reviewer" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.details.rejectedProperties).toEqual(
      expect.arrayContaining(["ownerId", "role"]),
    );
  });

  it("secure profile route rejects unknown properties", async () => {
    const response = await secureProfilePatch(
      new Request("http://localhost/api/secure/profile", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({ displayLabel: "Demo", isAdmin: true }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.details.rejectedProperties).toEqual(["isAdmin"]);
  });

  it("secure profile route accepts allowlisted properties", async () => {
    const response = await secureProfilePatch(
      new Request("http://localhost/api/secure/profile", {
        method: "PATCH",
        headers: jsonHeaders,
        body: JSON.stringify({
          displayLabel: "Updated demo profile",
          notificationsEnabled: false,
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.profile.data).toMatchObject({
      displayLabel: "Updated demo profile",
      notificationsEnabled: false,
    });
  });

  it("vulnerable SSRF route accepts private URL previews", async () => {
    vi.stubEnv("LAB_MODE", "local");
    vi.stubEnv("NODE_ENV", "test");

    const response = await vulnerableFetchUrlPost(
      new Request("http://localhost/api/vulnerable/fetch-url", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ url: "http://127.0.0.1/admin" }),
      }),
    );

    expect(response.status).toBe(200);
  });

  it("secure SSRF route rejects private URL previews", async () => {
    const response = await secureFetchUrlPost(
      new Request("http://localhost/api/secure/fetch-url", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ url: "https://127.0.0.1/admin" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.details.reason).toBe("private-host-rejected");
  });
});
