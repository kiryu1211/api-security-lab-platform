import { expect, test, type Page } from "@playwright/test";

async function settleVisualState(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await Promise.all(
      document
        .getAnimations()
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
}

test("matches the primary showcase visual states", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    window.sessionStorage.setItem("api-security-lab-opening-seen", "seen");
    window.localStorage.setItem("lab-ui-language", "ja");
    window.localStorage.setItem("lab-ui-theme", "light");
  });
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", { name: "APIセキュリティリスクラボ" }),
  ).toBeVisible();
  await settleVisualState(page);
  await expect(page).toHaveScreenshot("home-light-ja.png");

  await page.getByRole("button", { name: "リクエスト結果を表示" }).click();
  await page.getByRole("button", { name: "ダークテーマ" }).click();
  await page.getByRole("button", { name: "英語" }).click();
  await expect(
    page.locator('.api-result-box[data-has-result="true"]'),
  ).toHaveCount(2);
  await settleVisualState(page);
  await expect(page.locator(".comparison-heading-row")).toHaveScreenshot(
    "comparison-heading-dark-en.png",
  );
  await expect(
    page.locator('.api-result-box[data-has-result="true"]').first(),
  ).toHaveScreenshot("request-result-dark-en.png");
});
