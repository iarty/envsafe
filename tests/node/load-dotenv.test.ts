import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DotenvLoadError, loadDotenv } from "@/node/load-dotenv";

const fixture = (name: string): string =>
  resolve(import.meta.dirname, "../fixtures/env", name);

describe("loadDotenv", () => {
  it("loads existing files in the declared order", () => {
    const target: Record<string, string | undefined> = {};

    const result = loadDotenv({
      paths: [fixture("base.env"), fixture("local.env")],
      target,
    });

    expect(target).toMatchObject({
      BASE_ONLY: "base-value",
      LOCAL_ONLY: "local-value",
      SHARED_VALUE: "base-value",
    });
    expect(result.loadedFiles).toEqual([
      fixture("base.env"),
      fixture("local.env"),
    ]);
    expect(result.loadedKeys).toBe(4);
    expect(result.skippedFiles).toEqual([]);
  });

  it("preserves values already present in the target by default", () => {
    const target: Record<string, string | undefined> = {
      SHARED_VALUE: "process-value",
    };

    loadDotenv({ paths: [fixture("base.env")], target });

    expect(target.SHARED_VALUE).toBe("process-value");
    expect(target.BASE_ONLY).toBe("base-value");
  });

  it("allows ordered files to override existing and earlier values", () => {
    const target: Record<string, string | undefined> = {
      SHARED_VALUE: "process-value",
    };

    loadDotenv({
      override: true,
      paths: [fixture("base.env"), fixture("local.env")],
      target,
    });

    expect(target.SHARED_VALUE).toBe("local-value");
    expect(target.DATABASE_PASSWORD).toBe("local-secret");
  });

  it("skips missing files without loading them implicitly", () => {
    const target: Record<string, string | undefined> = {};
    const missingPath = fixture("missing.env");

    const result = loadDotenv({ paths: [missingPath], target });

    expect(result.loadedFiles).toEqual([]);
    expect(result.skippedFiles).toEqual([missingPath]);
    expect(target).toEqual({});
  });

  it("does not expose secret values when a file cannot be read", () => {
    const secretMarker = "database-password-must-not-leak";
    const directoryPath = resolve(import.meta.dirname, "../fixtures/env");

    expect(() =>
      loadDotenv({
        paths: [directoryPath],
        target: { SECRET_VALUE: secretMarker },
      }),
    ).toThrow(DotenvLoadError);

    try {
      loadDotenv({
        paths: [directoryPath],
        target: { SECRET_VALUE: secretMarker },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(DotenvLoadError);
      expect(String(error)).not.toContain(secretMarker);
      expect(JSON.stringify(error)).not.toContain(secretMarker);
    }
  });
});
