import { describe, expect, it } from "vitest";
import { GET as secureRateLimitGet } from "@/app/api/secure/rate-limit/search/route";
import { PATCH as secureProfilePatch } from "@/app/api/secure/profile/route";
import { POST as secureFetchUrlPost } from "@/app/api/secure/fetch-url/route";
import { GET as vulnerableRateLimitGet } from "@/app/api/vulnerable/rate-limit/search/route";
import { PATCH as vulnerableProfilePatch } from "@/app/api/vulnerable/profile/route";
import { POST as vulnerableFetchUrlPost } from "@/app/api/vulnerable/fetch-url/route";
import { resetRateLimitBuckets } from "./rate-limit-service";

describe("phase 6 demo routes", () => {
  it("vulnerable rate-limit route does not apply limits", async () => {
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
    resetRateLimitBuckets();
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
  });

  it("vulnerable profile route applies mass assignment fields", async () => {
    const response = await vulnerableProfilePatch(
      new Request("http://localhost/api/vulnerable/profile", {
        method: "PATCH",
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
        body: JSON.stringify({ ownerId: "user-demo-bob", role: "reviewer" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.profile.rejectedProperties).toEqual(
      expect.arrayContaining(["ownerId", "role"]),
    );
  });

  it("vulnerable SSRF route accepts private URL previews", async () => {
    const response = await vulnerableFetchUrlPost(
      new Request("http://localhost/api/vulnerable/fetch-url", {
        method: "POST",
        body: JSON.stringify({ url: "http://127.0.0.1/admin" }),
      }),
    );

    expect(response.status).toBe(200);
  });

  it("secure SSRF route rejects private URL previews", async () => {
    const response = await secureFetchUrlPost(
      new Request("http://localhost/api/secure/fetch-url", {
        method: "POST",
        body: JSON.stringify({ url: "https://127.0.0.1/admin" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.details.reason).toBe("private-host-rejected");
  });
});
