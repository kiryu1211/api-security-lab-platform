import { describe, expect, it } from "vitest";
import {
  safeProfileUpdate,
  unsafeProfileUpdate,
} from "./mass-assignment-service";
import {
  checkRateLimit,
  resetRateLimitBuckets,
  unsafeSearch,
} from "./rate-limit-service";
import { safeFetchPreview, unsafeFetchPreview } from "./ssrf-service";

describe("rate limit service", () => {
  it("keeps vulnerable search unrestricted", () => {
    expect(unsafeSearch("user-demo-alice", "demo")).toMatchObject({
      limitApplied: false,
    });
  });

  it("blocks after the safe request limit", () => {
    resetRateLimitBuckets();

    expect(checkRateLimit("user-demo-alice", "/demo", 1000).allowed).toBe(true);
    expect(checkRateLimit("user-demo-alice", "/demo", 1001).allowed).toBe(true);
    expect(checkRateLimit("user-demo-alice", "/demo", 1002).allowed).toBe(true);
    expect(checkRateLimit("user-demo-alice", "/demo", 1003)).toMatchObject({
      allowed: false,
      remaining: 0,
    });
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
