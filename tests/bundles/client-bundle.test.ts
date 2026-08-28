import { build } from "vite";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "../..");
const zodEntry = resolve(import.meta.dirname, "client-entry.ts");
const valibotEntry = resolve(import.meta.dirname, "valibot-entry.ts");
const forbiddenClientTokens = [
  "dotenv",
  "node:fs",
  "node:path",
  "src/node",
  "load-dotenv",
  "database-password-must-not-leak",
];

const bundleClientEntry = async (
  entry: string,
  external: string,
): Promise<string> => {
  const result = await build({
    configFile: false,
    root: projectRoot,
    resolve: {
      conditions: ["browser"],
    },
    build: {
      write: false,
      lib: {
        entry,
        formats: ["es"],
        fileName: () => "client.js",
      },
      rollupOptions: {
        external: [external],
      },
    },
  });

  const chunks = Array.isArray(result) ? result : [result];
  return chunks
    .flatMap((output) => ("output" in output ? output.output : []))
    .map((entry) => (entry.type === "chunk" ? entry.code : ""))
    .join("\n");
};

describe.sequential("client bundle boundaries", () => {
  it("does not include Node-only code, dotenv, or secret markers", async () => {
    const bundle = await bundleClientEntry(zodEntry, "zod");

    for (const token of forbiddenClientTokens) {
      expect(bundle, `client bundle contains ${token}`).not.toContain(token);
    }
  });

  it("keeps validator integrations isolated", async () => {
    const zodBundle = await bundleClientEntry(zodEntry, "zod");
    const valibotBundle = await bundleClientEntry(valibotEntry, "valibot");

    expect(zodBundle).not.toContain("valibot");
    expect(zodBundle).toContain("zod");
    expect(valibotBundle).not.toContain("zod");
    expect(valibotBundle).toContain("valibot");
  });

  it("rejects the Node subpath under browser conditions", async () => {
    await expect(
      build({
        configFile: false,
        root: projectRoot,
        resolve: {
          conditions: ["browser"],
        },
        build: {
          write: false,
          rollupOptions: {
            input: "virtual:envsafe-node-entry",
          },
        },
        plugins: [
          {
            name: "envsafe-node-entry",
            resolveId: (id: string) =>
              id === "virtual:envsafe-node-entry" ? id : undefined,
            load: (id: string) =>
              id === "virtual:envsafe-node-entry"
                ? 'import "@abarbonov/envsafe/node";'
                : undefined,
          },
        ],
      }),
    ).rejects.toThrow();
  });
});
