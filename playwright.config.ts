import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.UI_AUDIT_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./tests/ui-audit",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  outputDir: "node_modules/.cache/parislocalstack-ui-audit/results",
  use: {
    baseURL,
    trace: "off",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] }
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
