import { setOwnValue } from "./internal/record";
import type { ClientEnvOptions, EnvSource } from "./types";

const hasOwn = Object.prototype.hasOwnProperty;

export const pickClientEnv = (
  source: EnvSource,
  options: ClientEnvOptions = {},
): Readonly<EnvSource> => {
  const prefixes = options.prefixes ?? [];
  const allowedKeys = new Set(options.allow ?? []);
  const output: Record<string, unknown> = Object.create(null);

  validatePrefixes(prefixes);

  for (const key of options.allow ?? []) {
    if (hasOwn.call(source, key)) {
      setOwnValue(output, key, source[key]);
    }
  }

  if (prefixes.length === 0) {
    return Object.freeze(output) as Readonly<EnvSource>;
  }

  for (const [key, value] of Object.entries(source)) {
    if (
      allowedKeys.has(key) ||
      prefixes.some((prefix) => key.startsWith(prefix))
    ) {
      setOwnValue(output, key, value);
    }
  }

  return Object.freeze(output) as Readonly<EnvSource>;
};

const validatePrefixes = (prefixes: readonly string[]): void => {
  if (prefixes.some((prefix) => prefix.length === 0)) {
    throw new TypeError("Client prefixes must not include an empty string.");
  }
};
