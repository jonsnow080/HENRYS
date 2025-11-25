import { expect, test } from "@playwright/test";

const HOMEPAGE_PATH = "/";

test("homepage renders", async ({ page }) => {
  const response = await page.goto(HOMEPAGE_PATH);
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator("body")).toBeVisible();
});
