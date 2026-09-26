import { defineConfig } from "vitest/config";
import { config } from "dotenv";

config({ path: ".env.test" });

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: "./test/globalSetup.ts",
  },
});