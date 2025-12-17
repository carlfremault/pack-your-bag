import { defineConfig } from "vitest/config";

export const baseConfig = defineConfig({
  test: {
    coverage: {
      enabled: true,
      include: ["src/**/*.ts", "src/**/*.tsx"],
    },
  },
});
