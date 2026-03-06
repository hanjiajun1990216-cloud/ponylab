import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 1,
  timeout: 30000,
  workers: isCI ? 1 : 3,
  forbidOnly: isCI,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: isCI
    ? [
        {
          command: "node apps/api/dist/main.js",
          url: "http://localhost:4001/api/health",
          timeout: 30000,
          env: {
            NODE_ENV: "production",
            PORT: "4001",
          },
        },
        {
          command: "pnpm --filter @ponylab/web start",
          url: "http://localhost:3000",
          timeout: 30000,
          env: {
            NODE_ENV: "production",
            PORT: "3000",
          },
        },
      ]
    : {
        command: "pnpm --filter @ponylab/web dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 30000,
      },
});
