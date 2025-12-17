import { defineConfig } from "vitest/config";
import { uiConfig } from "@repo/vitest-config/ui";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  ...uiConfig,
  plugins: [tsconfigPaths()],
  test: {
    ...uiConfig.test,
    coverage: {
      ...uiConfig.test.coverage,
      provider: "v8",
      reporter: [["json", { file: "coverage-node.json" }]],
      reportsDirectory: "./coverage",
    },
    environment: "node",
    include: ["**/*.test.ts"],
    setupFiles: ["tsconfig-paths/register"],
  },
});
