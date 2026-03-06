import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;
const isRemote = !!process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: isRemote ? 2 : 1,
  timeout: isRemote ? 60000 : 30000,
  workers: isCI ? 1 : isRemote ? 2 : 3,
  forbidOnly: isCI,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  // Remote mode: no webServer needed (testing against deployed site)
  webServer: isRemote
    ? undefined
    : isCI
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
