import { beforeEach, describe, expect, it } from "vitest";
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

  it("secure preview allows allowlisted HTTPS host without real network access", () => {
    expect(safeFetchPreview("https://api.example.test/resource")).toMatchObject(
      {
        allowed: true,
        networkAccessPerformed: false,
      },
    );
  });
});
