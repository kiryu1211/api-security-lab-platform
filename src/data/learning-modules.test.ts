import { describe, expect, it } from "vitest";
import { learningModules } from "./learning-modules";

describe("learning modules", () => {
  it("defines translated content for every module", () => {
    for (const learningModule of learningModules) {
      expect(learningModule.title.ja).toBeTruthy();
      expect(learningModule.title.en).toBeTruthy();
      expect(learningModule.summary.ja).toBeTruthy();
      expect(learningModule.summary.en).toBeTruthy();
      expect(learningModule.checklist.ja.length).toBe(
        learningModule.checklist.en.length,
      );
    }
  });

  it("keeps vulnerable and secure route examples separated", () => {
    for (const learningModule of learningModules) {
      expect(learningModule.vulnerable.route).toContain("/api/vulnerable/");
      expect(learningModule.secure.route).toContain("/api/secure/");
    }
  });

  it("describes SSRF demos as previews without real network access", () => {
    const ssrfModule = learningModules.find((item) => item.id === "ssrf");

    expect(ssrfModule?.vulnerable.response.ja).toContain(
      "実ネットワークアクセスは行いません",
    );
    expect(ssrfModule?.vulnerable.response.en).toContain(
      "without performing real network access",
    );
  });
});
