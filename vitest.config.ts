import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@abarbonov/envsafe/zod": resolve(
        import.meta.dirname,
        "src/adapters/zod.ts",
      ),
      "@abarbonov/envsafe/valibot": resolve(
        import.meta.dirname,
        "src/adapters/valibot.ts",
      ),
      "@abarbonov/envsafe/node": resolve(
        import.meta.dirname,
        "src/node/index.ts",
      ),
      "@abarbonov/envsafe": resolve(import.meta.dirname, "src/index.ts"),
      "@": resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    passWithNoTests: true,
  },
});
