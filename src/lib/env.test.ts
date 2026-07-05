import { describe, expect, it } from "vitest";
import { assertVulnerableApisEnabled, getLabRuntimeSafety } from "./env";

describe("lab runtime safety", () => {
  it("enables vulnerable APIs only in local non-production mode", () => {
    expect(
      getLabRuntimeSafety({ LAB_MODE: "local", NODE_ENV: "development" }),
    ).toMatchObject({
      vulnerableApisEnabled: true,
    });
  });

  it("disables vulnerable APIs in production even when LAB_MODE is local", () => {
    expect(
      assertVulnerableApisEnabled({
        LAB_MODE: "local",
        NODE_ENV: "production",
      }),
    ).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("disables vulnerable APIs when LAB_MODE is disabled", () => {
    expect(
      assertVulnerableApisEnabled({
        LAB_MODE: "disabled",
        NODE_ENV: "development",
      }),
    ).toMatchObject({
      ok: false,
      status: 403,
    });
  });
});
