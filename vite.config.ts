import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const entries = {
  index: resolve(import.meta.dirname, "src/index.ts"),
  zod: resolve(import.meta.dirname, "src/adapters/zod.ts"),
  valibot: resolve(import.meta.dirname, "src/adapters/valibot.ts"),
  node: resolve(import.meta.dirname, "src/node/index.ts"),
};

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: entries,
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: [/^node:/, "dotenv", "valibot", "zod"],
    },
  },
  plugins: [
    dts({
      entryRoot: "src",
      rollupTypes: false,
      tsconfigPath: "tsconfig.build.json",
    }),
  ],
});
