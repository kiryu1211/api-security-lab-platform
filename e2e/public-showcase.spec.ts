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
