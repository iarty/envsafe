import type { ZodType, output } from "zod";
import { createEnv as createCoreEnv } from "@/core/create-env";
import type { SchemaAdapter } from "@/core/schema";
import type { EnvSource } from "@/core/types";
import { normalizeZodIssues } from "@/adapters/internal/normalize-zod-issues";

export { EnvValidationError, pickClientEnv } from "@/index";
export type { ClientEnvOptions, EnvIssue, EnvSource } from "@/core/types";

export type ZodSchemaMap = Readonly<Record<string, ZodType>>;

export type InferZodSchemaMap<TSchemas extends ZodSchemaMap> = {
  readonly [TKey in keyof TSchemas]: output<TSchemas[TKey]>;
};

export interface ZodCreateEnvOptions<TSchemas extends ZodSchemaMap> {
  readonly schema: TSchemas;
  readonly source: EnvSource;
}

const zodAdapter: SchemaAdapter<ZodType, unknown> = {
  parse: (schema, input) => {
    const result = schema.safeParse(input);

    if (result.success) {
      return { ok: true, value: result.data };
    }

    return { ok: false, issues: normalizeZodIssues(result.error.issues) };
  },
};

export const createEnv = <TSchemas extends ZodSchemaMap>(
  options: ZodCreateEnvOptions<TSchemas>,
): Readonly<InferZodSchemaMap<TSchemas>> =>
  createCoreEnv<InferZodSchemaMap<TSchemas>, ZodType>({
    adapter: zodAdapter,
    schema: options.schema,
    source: options.source,
  });
