import { describe, expect, it } from "vitest";
import { learningModules } from "./learning-modules";

describe("learning modules", () => {
  it("covers every OWASP API Security Top 10 2023 category once", () => {
    const expectedCategories = [
      "API1:2023",
      "API2:2023",
      "API3:2023",
      "API4:2023",
      "API5:2023",
      "API6:2023",
      "API7:2023",
      "API8:2023",
      "API9:2023",
      "API10:2023",
    ];
    const riskCategories = learningModules.map((item) => item.riskCategory);

    for (const expectedCategory of expectedCategories) {
      expect(
        riskCategories.filter((category) =>
          category.includes(expectedCategory),
        ),
      ).toHaveLength(1);
    }

    expect(learningModules.every((item) => item.progress === "ready")).toBe(
      true,
    );
  });

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
