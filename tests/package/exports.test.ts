import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "../..");
const packageJsonPath = resolve(projectRoot, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
  exports: Record<string, unknown>;
};

const entryPoints = [".", "./zod", "./valibot", "./node"] as const;

const packageName = "@abarbonov/envsafe";
const expectedExports: Record<string, string[]> = {
  [packageName]: ["createEnv", "pickClientEnv", "EnvValidationError"],
  [`${packageName}/zod`]: ["createEnv", "pickClientEnv", "EnvValidationError"],
  [`${packageName}/valibot`]: [
    "createEnv",
    "pickClientEnv",
    "EnvValidationError",
  ],
  [`${packageName}/node`]: ["loadDotenv", "DotenvLoadError"],
};

const buildPackage = (): void => {
  execFileSync("npm", ["run", "build"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "pipe",
  });
};

describe.sequential("package exports", () => {
  beforeAll(() => {
    buildPackage();
  });

  it("publishes only the deliberate public subpaths", () => {
    expect(Object.keys(packageJson.exports).sort()).toEqual(
      [...entryPoints].sort(),
    );
    expect(packageJson.exports["./node"]).not.toHaveProperty("browser");
  });

  it("generates declarations for every public entry point", () => {
    const declarationFiles = [
      "dist/index.d.ts",
      "dist/adapters/zod.d.ts",
      "dist/adapters/valibot.d.ts",
      "dist/node/index.d.ts",
    ];

    for (const declarationFile of declarationFiles) {
      expect(existsSync(resolve(projectRoot, declarationFile))).toBe(true);
    }
  });

  it("resolves every public entry point through ESM", () => {
    const source = `
      const entries = ${JSON.stringify(expectedExports)};
      for (const [specifier, names] of Object.entries(entries)) {
        const module = await import(specifier);
        for (const name of names) {
          if (!(name in module)) {
            throw new Error(specifier + " is missing " + name);
          }
        }
      }
    `;

    expect(() =>
      execFileSync(process.execPath, ["--input-type=module", "-e", source], {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: "pipe",
      }),
    ).not.toThrow();
  });

  it("resolves every public entry point through CJS", () => {
    const source = `
      const entries = ${JSON.stringify(expectedExports)};
      for (const [specifier, names] of Object.entries(entries)) {
        const module = require(specifier);
        for (const name of names) {
          if (!(name in module)) {
            throw new Error(specifier + " is missing " + name);
          }
        }
      }
    `;

    expect(() =>
      execFileSync(process.execPath, ["-e", source], {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: "pipe",
      }),
    ).not.toThrow();
  });
});
