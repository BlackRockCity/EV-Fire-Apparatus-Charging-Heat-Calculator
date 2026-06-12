import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export default defineConfig({
  root: rootDir,
  test: {
    environment: "node",
    include: ["dev/tests/**/*.test.js"],
    testTimeout: 10000
  }
});
