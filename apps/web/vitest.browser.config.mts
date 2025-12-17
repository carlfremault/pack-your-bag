import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { uiConfig } from "@repo/vitest-config/ui";

export default defineConfig({
  ...uiConfig,
  plugins: [react(), tsconfigPaths()],
  test: {
    ...uiConfig.test,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        {
          browser: "chromium",
        },
      ],
    },
    coverage: {
      ...uiConfig.test.coverage,
      provider: "istanbul",
      reporter: [["json", { file: "coverage-browser.json" }]],
      reportsDirectory: "./coverage",
    },
    include: ["**/*.browser.test.tsx"],
  },
});
