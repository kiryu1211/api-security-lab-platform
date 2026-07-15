import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

type CspWindow = Window & { __cspViolations?: string[] };

const accessibilityTags = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22a",
  "wcag22aa",
];

const topicMatrix = [
  {
    ja: "BOLAとオブジェクト単位の認可確認",
    en: "BOLA and Object Ownership Checks",
    statuses: [200, 403],
  },
  {
    ja: "認証とトークン検証",
    en: "Authentication and Token Validation",
    statuses: [200, 401],
  },
  {
    ja: "Mass Assignmentとプロパティ認可",
    en: "Mass Assignment and Property Authorization",
    statuses: [200, 403],
  },
  {
    ja: "レート制限と自動化悪用対策",
    en: "Rate Limiting and Abuse Prevention",
    statuses: [200, 429],
  },
  {
    ja: "機能単位の認可と管理操作の保護",
    en: "Function-Level Authorization for Admin Actions",
    statuses: [200, 403],
  },
  {
    ja: "Sensitive Business Flowsと業務フロー悪用対策",
    en: "Sensitive Business Flows and Abuse Controls",
    statuses: [200, 403],
  },
  {
    ja: "SSRFと外部URL取得制御",
    en: "SSRF and Outbound URL Controls",
    statuses: [200, 403],
  },
  {
    ja: "Security Misconfigurationと診断情報の公開制御",
    en: "Security Misconfiguration and Diagnostic Exposure Controls",
    statuses: [200, 200],
  },
  {
    ja: "APIインベントリと旧バージョン管理",
    en: "API Inventory and Legacy Version Management",
    statuses: [200, 403],
  },
  {
    ja: "外部API応答の過信と検証",
    en: "Unsafe Consumption of Third-Party APIs",
    statuses: [200, 403],
  },
] as const;

async function expectNoAccessibilityViolations(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await Promise.all(
      document
        .getAnimations()
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  const { violations } = await new AxeBuilder({ page })
    .withTags(accessibilityTags)
    .analyze();
  const details = violations
    .map(
      (violation) =>
        `${violation.id}: ${violation.help} (${violation.nodes
          .flatMap((node) => node.target)
          .join(", ")})`,
    )
    .join("\n");

  expect(violations, details).toEqual([]);
}

test("keeps the interactive showcase functional without CSP violations or API calls", async ({
  page,
}) => {
  const apiRequests: string[] = [];
  const consoleErrors: string[] = [];
  const cspConsoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      apiRequests.push(`${request.method()} ${pathname}`);
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }

    if (
      message.type() === "error" &&
      /content security policy|refused to/i.test(message.text())
    ) {
      cspConsoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    window.sessionStorage.setItem("api-security-lab-opening-seen", "seen");
    const cspWindow = window as CspWindow;
    cspWindow.__cspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      cspWindow.__cspViolations?.push(
        `${event.effectiveDirective}: ${event.blockedURI}`,
      );
    });
  });

  let response = await page.goto("/");

  if (await page.getByRole("dialog").isVisible()) {
    await page.evaluate(() => {
      window.sessionStorage.setItem("api-security-lab-opening-seen", "seen");
    });
    response = await page.reload();
  }

  const policy = response?.headers()["content-security-policy"] ?? "";

  expect(response?.status()).toBe(200);
  expect(policy).toContain("script-src");
  expect(policy).toContain("style-src");
  expect(policy).not.toContain("'unsafe-inline'");
  expect(policy).not.toContain("'unsafe-eval'");
  await expect(
    page.getByRole("heading", { name: "APIセキュリティリスクラボ" }),
  ).toBeVisible();
  await expectNoAccessibilityViolations(page);
  await expect(page.locator(".app-shell [style]")).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  const requestResultsButton = page.getByRole("button", {
    name: "リクエスト結果を表示",
  });
  await requestResultsButton.focus();
  await expect(requestResultsButton).toBeFocused();
  await page.keyboard.press("Enter");
  const resultBoxes = page.locator('.api-result-box[data-has-result="true"]');
  await expect(resultBoxes).toHaveCount(2);
  await expect(resultBoxes.first()).toContainText("脆弱APIのリクエスト結果");
  await expect(resultBoxes.first()).toContainText("HTTP 200");
  await expect(resultBoxes.last()).toContainText("安全APIのリクエスト結果");
  await expect(resultBoxes.last()).toContainText("HTTP 403");
  await page.keyboard.press("Shift+Tab");
  await expect(resultBoxes.last().locator("pre")).toBeFocused();
  expect(apiRequests).toEqual([]);

  const lightThemeButton = page.getByRole("button", { name: "ライトテーマ" });
  const darkThemeButton = page.getByRole("button", { name: "ダークテーマ" });
  await lightThemeButton.focus();
  await page.keyboard.press("Tab");
  await expect(darkThemeButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(() => (window as CspWindow).__cspViolations ?? []),
  ).toEqual([]);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "ダークテーマ" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "日本語" })).toBeFocused();
  await page.keyboard.press("Tab");
  const englishButton = page.getByRole("button", { name: "英語" });
  await expect(englishButton).toBeFocused();
  await page.keyboard.press("Enter");
  const englishResultsButton = page.getByRole("button", {
    name: "Show request results",
  });
  await englishResultsButton.focus();
  await page.keyboard.press("Enter");
  await expect(resultBoxes).toHaveCount(2);
  await expect(resultBoxes.first()).toContainText(
    "Vulnerable API request result",
  );
  await expect(resultBoxes.last()).toContainText("Secure API request result");
  await expectNoAccessibilityViolations(page);
  await expect(page.locator(".app-shell [style]")).toHaveCount(0);
  expect(apiRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(cspConsoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => (window as CspWindow).__cspViolations ?? []),
  ).toEqual([]);
});

test("covers every learning topic in Japanese and English without accessibility regressions", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const apiRequests: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      apiRequests.push(`${request.method()} ${pathname}`);
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    window.sessionStorage.setItem("api-security-lab-opening-seen", "seen");
  });
  const response = await page.goto("/");
  const topicButtons = page.locator(".topic-card");
  const resultBoxes = page.locator('.api-result-box[data-has-result="true"]');

  expect(response?.status()).toBe(200);
  await expect(topicButtons).toHaveCount(topicMatrix.length);

  for (const topic of topicMatrix) {
    const topicButton = page.getByRole("button", { name: topic.ja });

    await topicButton.click();
    await expect(topicButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".detail-panel h3")).toHaveText(topic.ja);
    await page.getByRole("button", { name: "リクエスト結果を表示" }).click();
    await expect(resultBoxes).toHaveCount(2);
    await expect(resultBoxes.first().locator("pre")).toContainText(
      `HTTP ${topic.statuses[0]}`,
    );
    await expect(resultBoxes.last().locator("pre")).toContainText(
      `HTTP ${topic.statuses[1]}`,
    );
    await expectNoAccessibilityViolations(page);
  }

  await page.getByRole("button", { name: "英語" }).click();

  for (const topic of topicMatrix) {
    const topicButton = page.getByRole("button", { name: topic.en });

    await topicButton.click();
    await expect(topicButton).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".detail-panel h3")).toHaveText(topic.en);
    await expect(resultBoxes).toHaveCount(2);
    await expect(resultBoxes.first()).toContainText(
      "Vulnerable API request result",
    );
    await expect(resultBoxes.last()).toContainText("Secure API request result");
    await expect(resultBoxes.first().locator("pre")).toContainText(
      `HTTP ${topic.statuses[0]}`,
    );
    await expect(resultBoxes.last().locator("pre")).toContainText(
      `HTTP ${topic.statuses[1]}`,
    );
    await expectNoAccessibilityViolations(page);
  }

  expect(apiRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("keeps the opening dialog keyboard accessible in both languages", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });

  const response = await page.goto("/");
  const japaneseDialog = page.getByRole("dialog", {
    name: "APIを守る設計を、見える形に。",
  });
  const japaneseSkipButton = page.getByRole("button", { name: "スキップ" });

  expect(response?.status()).toBe(200);
  await expect(japaneseDialog).toBeVisible();
  await expect(japaneseDialog).toHaveAttribute("aria-modal", "true");
  await expect(japaneseSkipButton).toBeFocused();
  await expect(page.locator("header")).toHaveAttribute("inert", "");
  await expect(page.locator("main")).toHaveAttribute("inert", "");
  await page.keyboard.press("Tab");
  await expect(japaneseSkipButton).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(japaneseSkipButton).toBeFocused();
  await page.evaluate(() => {
    document.getAnimations().forEach((animation) => animation.finish());
  });
  await expectNoAccessibilityViolations(page);

  await page.keyboard.press("Escape");
  await expect(japaneseDialog).toHaveCount(0);
  const japaneseBrand = page.getByRole("link", {
    name: "APIセキュリティ学習・検証プラットフォーム",
  });
  await expect(japaneseBrand).toBeFocused();
  await expect(page.locator("header")).not.toHaveAttribute("inert", "");
  await expect(page.locator("main")).not.toHaveAttribute("inert", "");
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.sessionStorage.getItem("api-security-lab-opening-seen"),
      ),
    )
    .toBe("seen");

  await page.evaluate(() => {
    window.localStorage.setItem("lab-ui-language", "en");
    window.sessionStorage.removeItem("api-security-lab-opening-seen");
  });
  await page.reload();
  const englishDialog = page.getByRole("dialog", {
    name: "Make API Defenses Visible",
  });
  const englishSkipButton = page.getByRole("button", { name: "Skip" });

  await expect(englishDialog).toBeVisible();
  await expect(englishSkipButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(englishDialog).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "API Security Lab Platform" }),
  ).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "API Security Risk Lab" }),
  ).toBeVisible();

  await page.evaluate(() => {
    window.sessionStorage.removeItem("api-security-lab-opening-seen");
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "API Security Risk Lab" }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toHaveAttribute(
    "data-opening-locked",
    "true",
  );
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
