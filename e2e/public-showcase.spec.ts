import { expect, test } from "@playwright/test";

type CspWindow = Window & { __cspViolations?: string[] };

test("keeps the interactive showcase functional without CSP violations or API calls", async ({
  page,
}) => {
  const apiRequests: string[] = [];
  const cspConsoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("request", (request) => {
    const pathname = new URL(request.url()).pathname;

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      apiRequests.push(`${request.method()} ${pathname}`);
    }
  });
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /content security policy|refused to/i.test(message.text())
    ) {
      cspConsoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
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

  const response = await page.goto("/");
  const policy = response?.headers()["content-security-policy"] ?? "";

  expect(response?.status()).toBe(200);
  expect(policy).toContain("script-src");
  expect(policy).toContain("style-src");
  expect(policy).not.toContain("'unsafe-inline'");
  expect(policy).not.toContain("'unsafe-eval'");
  await expect(
    page.getByRole("heading", { name: "APIセキュリティリスクラボ" }),
  ).toBeVisible();
  await expect(page.locator(".app-shell [style]")).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);

  await page.getByRole("button", { name: "リクエスト結果を表示" }).click();
  const resultBoxes = page.locator('.api-result-box[data-has-result="true"]');
  await expect(resultBoxes).toHaveCount(2);
  await expect(resultBoxes.first()).toContainText("脆弱APIのリクエスト結果");
  await expect(resultBoxes.first()).toContainText("HTTP 200");
  await expect(resultBoxes.last()).toContainText("安全APIのリクエスト結果");
  await expect(resultBoxes.last()).toContainText("HTTP 403");
  expect(apiRequests).toEqual([]);

  await page.getByRole("button", { name: "ダークテーマ" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(() => (window as CspWindow).__cspViolations ?? []),
  ).toEqual([]);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "英語" }).click();
  await expect(
    page.getByRole("button", { name: "Show request results" }),
  ).toBeVisible();
  await expect(page.locator(".app-shell [style]")).toHaveCount(0);
  expect(apiRequests).toEqual([]);
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
