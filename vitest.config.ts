import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}", "src/**/__tests__/**/*.{js,ts}",],
    exclude: [
      "playwright/**",
      "**/playwright.config.{js,ts,mjs,cjs}",
      "**/node_modules/**",
    ],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
