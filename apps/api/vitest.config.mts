import { defineConfig } from "vitest/config";
import { baseConfig } from "@repo/vitest-config/base";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  ...baseConfig,
  plugins: [tsconfigPaths()],
  test: {
    ...baseConfig.test,
    coverage: {
      ...baseConfig.test?.coverage,
      provider: "v8",
      reporter: [["json", { file: "coverage-node.json" }]],
      reportsDirectory: "./coverage",
    },
    environment: "node",
    include: ["**/*.test.ts"],
    setupFiles: ["tsconfig-paths/register"],
  },
});
