import { describe, expect, it } from "vitest";
import {
  assertVulnerableApisEnabled,
  getLabRuntimeSafety,
  isPublicShowcase,
} from "./env";

describe("lab runtime safety", () => {
  const localTestEnv = { LAB_MODE: "local", NODE_ENV: "test" };
  const localhostRequest = new Request(
    "http://localhost/api/vulnerable/health",
  );

  it("keeps vulnerable APIs disabled when LAB_MODE is unset", () => {
    expect(getLabRuntimeSafety({ NODE_ENV: "development" })).toMatchObject({
      labMode: "disabled",
      vulnerableApisEnabled: false,
    });
    expect(
      assertVulnerableApisEnabled(localhostRequest, {
        NODE_ENV: "development",
      }),
    ).toMatchObject({ ok: false, status: 403 });
  });

  it("enables public showcase mode only for an explicit valid value", () => {
    expect(isPublicShowcase("")).toBe(false);
    expect(isPublicShowcase("false")).toBe(false);
    expect(isPublicShowcase("true")).toBe(true);
  });

  it.each(["TRUE", " true ", "invalid"])(
    "fails closed into public showcase mode for an invalid value: %s",
    (value) => {
      expect(isPublicShowcase(value)).toBe(true);
    },
  );

  it("keeps vulnerable APIs disabled when public showcase mode is active", () => {
    expect(
      assertVulnerableApisEnabled(localhostRequest, {
        LAB_MODE: "local",
        NODE_ENV: "test",
        PUBLIC_SHOWCASE: "true",
      }),
    ).toMatchObject({ ok: false, status: 403 });
  });

  it.each(["LOCAL", " local ", "invalid"])(
    "fails closed when LAB_MODE is invalid: %s",
    (labMode) => {
      expect(
        assertVulnerableApisEnabled(localhostRequest, {
          LAB_MODE: labMode,
          NODE_ENV: "development",
        }),
      ).toMatchObject({ ok: false, status: 403 });
    },
  );

  it("enables vulnerable APIs only in local development or test mode", () => {
    expect(
      getLabRuntimeSafety({ LAB_MODE: "local", NODE_ENV: "development" }),
    ).toMatchObject({
      vulnerableApisEnabled: true,
    });
    expect(getLabRuntimeSafety(localTestEnv)).toMatchObject({
      vulnerableApisEnabled: true,
    });
  });

  it("disables vulnerable APIs in production even when LAB_MODE is local", () => {
    expect(
      assertVulnerableApisEnabled(localhostRequest, {
        LAB_MODE: "local",
        NODE_ENV: "production",
      }),
    ).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("disables vulnerable APIs in staging", () => {
    expect(
      assertVulnerableApisEnabled(localhostRequest, {
        LAB_MODE: "local",
        NODE_ENV: "staging",
      }),
    ).toMatchObject({ ok: false, status: 403 });
  });

  it("disables vulnerable APIs when NODE_ENV is unset", () => {
    expect(
      assertVulnerableApisEnabled(localhostRequest, { LAB_MODE: "local" }),
    ).toMatchObject({ ok: false, status: 403 });
  });

  it("disables vulnerable APIs when LAB_MODE is disabled", () => {
    expect(
      assertVulnerableApisEnabled(localhostRequest, {
        LAB_MODE: "disabled",
        NODE_ENV: "development",
      }),
    ).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("requires a request", () => {
    expect(assertVulnerableApisEnabled(undefined, localTestEnv)).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("rejects a non-loopback URL hostname", () => {
    expect(
      assertVulnerableApisEnabled(
        new Request("https://lab.example/api/vulnerable/health"),
        localTestEnv,
      ),
    ).toMatchObject({ ok: false, status: 403 });
  });

  it("rejects a non-loopback Host header", () => {
    expect(
      assertVulnerableApisEnabled(
        new Request("http://localhost/api/vulnerable/health", {
          headers: { Host: "lab.example" },
        }),
        localTestEnv,
      ),
    ).toMatchObject({ ok: false, status: 403 });
  });

  it.each([
    "http://localhost/api/vulnerable/health",
    "http://127.0.0.1/api/vulnerable/health",
    "http://[::1]/api/vulnerable/health",
  ])("allows the loopback request hostname in %s", (url) => {
    expect(assertVulnerableApisEnabled(new Request(url), localTestEnv)).toEqual(
      {
        ok: true,
        safety: { vulnerableApisEnabled: true },
      },
    );
  });

  it("allows a loopback Host header with a port", () => {
    expect(
      assertVulnerableApisEnabled(
        new Request("http://localhost/api/vulnerable/health", {
          headers: { Host: "[::1]:3000" },
        }),
        localTestEnv,
      ),
    ).toMatchObject({ ok: true });
  });
});
