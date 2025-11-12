import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { Role } from "@/lib/prisma-constants";
import { createSessionCookie } from "./utils/session-cookie";

const authSecret = process.env.PLAYWRIGHT_TEST_AUTH_SECRET ?? "playwright-test-secret";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const shouldRunE2E = process.env.RUN_ADMIN_E2E === "1";

test.describe("admin access control", () => {
  test.skip(!shouldRunE2E, "Set RUN_ADMIN_E2E=1 to enable admin RBAC E2E tests.");

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("redirects logged out visitors to the login page", async ({ page }) => {
    const response = await page.request.get("/admin", { failOnStatusCode: false });
    expect(response.status()).toBe(302);
    const location = response.headers()["location"] ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("redirectTo=%2Fadmin");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin/);
    await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
  });

  test("returns a branded 403 page for members", async ({ context, page }) => {
    const cookie = await createSessionCookie({ role: Role.MEMBER, secret: authSecret, baseURL });
    await context.addCookies([cookie]);

    const response = await page.goto("/admin");
    expect(response?.status()).toBe(403);
    await expect(page).toHaveURL(`${baseURL}/admin`);
    await expect(page.getByRole("heading", { level: 1, name: "Access denied" })).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations.filter((violation) => violation.impact === "serious")).toEqual([]);
  });

  test("allows admins through to the dashboard", async ({ context, page }) => {
    const cookie = await createSessionCookie({ role: Role.ADMIN, secret: authSecret, baseURL });
    await context.addCookies([cookie]);

    const response = await page.goto("/admin");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(`${baseURL}/admin`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome back");
  });
});
