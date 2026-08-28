import { readFileSync } from "node:fs";
import { parse } from "dotenv";

export type DotenvTarget = Record<string, string | undefined>;

export interface LoadDotenvOptions {
  readonly paths: readonly string[];
  readonly target: DotenvTarget;
  readonly override?: boolean;
}

export interface LoadDotenvResult {
  readonly loadedFiles: readonly string[];
  readonly loadedKeys: number;
  readonly skippedFiles: readonly string[];
}

export class DotenvLoadError extends Error {
  readonly filePath: string;

  constructor(filePath: string) {
    super(`Unable to load environment file: ${filePath}.`);

    this.name = "DotenvLoadError";
    this.filePath = filePath;
  }
}

export const loadDotenv = ({
  paths,
  target,
  override = false,
}: LoadDotenvOptions): LoadDotenvResult => {
  const loadedFiles: string[] = [];
  const skippedFiles: string[] = [];
  let loadedKeys = 0;

  for (const filePath of paths) {
    const source = readDotenvFile(filePath, skippedFiles);

    if (source === undefined) {
      continue;
    }

    const parsed = parse(source);
    loadedFiles.push(filePath);

    for (const [key, value] of Object.entries(parsed)) {
      if (override || target[key] === undefined) {
        target[key] = value;
        loadedKeys += 1;
      }
    }
  }

  return {
    loadedFiles: Object.freeze(loadedFiles),
    loadedKeys,
    skippedFiles: Object.freeze(skippedFiles),
  };
};

const readDotenvFile = (
  filePath: string,
  skippedFiles: string[],
): string | undefined => {
  try {
    return readFileSync(filePath, "utf8");
  } catch (error) {
    if (isMissingFileError(error)) {
      skippedFiles.push(filePath);
      return undefined;
    }

    throw new DotenvLoadError(filePath);
  }
};

const isMissingFileError = (error: unknown): boolean =>
  error instanceof Error &&
  "code" in error &&
  (error as NodeJS.ErrnoException).code === "ENOENT";
