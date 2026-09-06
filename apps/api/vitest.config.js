import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // The suite runs against a real Postgres schema, so files must not race
    // each other over shared rows.
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
