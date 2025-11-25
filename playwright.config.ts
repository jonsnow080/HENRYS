import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const authSecret = process.env.PLAYWRIGHT_TEST_AUTH_SECRET ?? "playwright-test-secret";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.SKIP_PLAYWRIGHT_WEB_SERVER === "1"
    ? undefined
    : {
        command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? "pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          AUTH_SECRET: authSecret,
          PLAYWRIGHT_TEST_AUTH_SECRET: authSecret,
          NODE_ENV: process.env.NODE_ENV ?? "test",
          ...("DATABASE_URL" in process.env ? { DATABASE_URL: process.env.DATABASE_URL as string } : {}),
        },
      },
});
