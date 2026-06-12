import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  testDir: resolve(rootDir, "dev/tests/e2e"),
  outputDir: resolve(rootDir, "test-results"),
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npx vite --host 127.0.0.1 --port 4173",
    cwd: rootDir,
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
