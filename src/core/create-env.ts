import { EnvValidationError } from "./errors";
import { createEnvIssue } from "./issues";
import { setOwnValue } from "./internal/record";
import type { SchemaAdapter } from "./schema";
import type { EnvIssue, EnvSource } from "./types";

export interface CreateEnvOptions<
  TOutput extends Record<string, unknown>,
  TSchema,
> {
  readonly adapter: SchemaAdapter<TSchema, unknown>;
  readonly schema: Readonly<Record<keyof TOutput, TSchema>>;
  readonly source: EnvSource;
}

export const createEnv = <TOutput extends Record<string, unknown>, TSchema>(
  options: CreateEnvOptions<TOutput, TSchema>,
): Readonly<TOutput> => {
  const output: Record<string, unknown> = Object.create(null);
  const issues: EnvIssue[] = [];
  const schemaEntries = Object.entries(options.schema) as [string, TSchema][];

  for (const [key, schema] of schemaEntries) {
    const result = parseSchema(options.adapter, schema, key, options.source);

    if (!result.ok) {
      issues.push(...result.issues.map((issue) => createEnvIssue(key, issue)));
      continue;
    }

    setOwnValue(output, key, result.value);
  }

  if (issues.length > 0) {
    throw new EnvValidationError(issues);
  }

  return Object.freeze(output) as Readonly<TOutput>;
};

const parseSchema = <TSchema>(
  adapter: SchemaAdapter<TSchema, unknown>,
  schema: TSchema,
  key: string,
  source: EnvSource,
) => {
  try {
    return adapter.parse(schema, source[key], { key, source });
  } catch {
    throw new EnvValidationError([
      {
        expected: "a value accepted by this schema",
        key,
        message:
          "Expected a value accepted by this schema. Set a value that matches the expected format.",
      },
    ]);
  }
};
