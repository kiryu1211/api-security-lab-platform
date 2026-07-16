import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  safeProfileUpdate,
  unsafeProfileUpdate,
} from "./mass-assignment-service";
import {
  checkRateLimit,
  getRateLimitBucketCount,
  RATE_LIMIT_MAX_BUCKETS,
  resetRateLimitBuckets,
  unsafeSearch,
} from "./rate-limit-service";
import { safeFetchPreview, unsafeFetchPreview } from "./ssrf-service";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rate limit service", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
  });

  it("keeps vulnerable search unrestricted", () => {
    expect(unsafeSearch("user-demo-alice", "demo")).toMatchObject({
      limitApplied: false,
    });
  });

  it("blocks after the safe request limit", () => {
    expect(checkRateLimit("user-demo-alice", "/demo", 1000).allowed).toBe(true);
    expect(checkRateLimit("user-demo-alice", "/demo", 1001).allowed).toBe(true);
    expect(checkRateLimit("user-demo-alice", "/demo", 1002).allowed).toBe(true);
    expect(checkRateLimit("user-demo-alice", "/demo", 1003)).toMatchObject({
      allowed: false,
      remaining: 0,
    });
  });

  it("removes all expired buckets before adding a new one", () => {
    checkRateLimit("user-demo-alice", "/first", 1_000);
    checkRateLimit("user-demo-bob", "/second", 1_001);

    checkRateLimit("user-demo-admin", "/third", 61_000);

    expect(getRateLimitBucketCount()).toBe(2);
  });

  it("keeps the bucket store within its finite capacity", () => {
    for (let index = 0; index < RATE_LIMIT_MAX_BUCKETS + 10; index += 1) {
      checkRateLimit("user-demo-alice", `/demo/${index}`, 1_000 + index);
    }

    expect(getRateLimitBucketCount()).toBe(RATE_LIMIT_MAX_BUCKETS);
    expect(checkRateLimit("user-demo-alice", "/demo/109", 2_000)).toMatchObject(
      { remaining: 1 },
    );
  });
});

describe("mass assignment service", () => {
  it("vulnerable update applies privileged properties", () => {
    expect(
      unsafeProfileUpdate({
        displayLabel: "changed",
        ownerId: "user-demo-bob",
        role: "reviewer",
      }),
    ).toMatchObject({
      ownerId: "user-demo-bob",
      data: {
        role: "reviewer",
      },
    });
  });

  it("secure update rejects properties outside the allowlist", () => {
    expect(
      safeProfileUpdate({
        displayLabel: "changed",
        ownerId: "user-demo-bob",
        role: "reviewer",
      }),
    ).toMatchObject({
      ownerId: "user-demo-alice",
      rejectedProperties: ["ownerId", "role"],
    });
  });
});

describe("SSRF service", () => {
  it("vulnerable preview accepts arbitrary URLs without real network access", () => {
    expect(unsafeFetchPreview("http://127.0.0.1/admin")).toMatchObject({
      accepted: true,
      networkAccessPerformed: false,
    });
  });

  it("secure preview rejects private hosts", () => {
    expect(safeFetchPreview("https://127.0.0.1/admin")).toMatchObject({
      allowed: false,
      reason: "private-host-rejected",
    });
  });

  it("secure preview rejects non-HTTPS URLs before host evaluation", () => {
    expect(safeFetchPreview("http://api.example.test/resource")).toEqual({
      allowed: false,
      reason: "protocol-not-allowed",
    });
  });

  it("secure preview rejects public hosts outside the allowlist", () => {
    expect(safeFetchPreview("https://public.example.test/resource")).toEqual({
      allowed: false,
      reason: "host-not-allowed",
    });
  });

  it("secure preview returns the constrained redirect and timeout policy", () => {
    expect(safeFetchPreview("https://api.example.test/resource")).toEqual({
      allowed: true,
      wouldFetch: "https://api.example.test/resource",
      redirectPolicy: "manual",
      timeoutMs: 2000,
      networkAccessPerformed: false,
    });
  });

  it("never performs outbound fetches for vulnerable or secure previews", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("SSRF previews must not perform outbound fetches.");
    });

    unsafeFetchPreview("http://127.0.0.1/admin");
    safeFetchPreview("https://api.example.test/resource");

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
