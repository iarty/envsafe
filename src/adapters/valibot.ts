import {
  safeParse,
  type BaseIssue,
  type BaseSchema,
  type InferOutput,
} from "valibot";
import { normalizeValibotIssues } from "@/adapters/internal/normalize-valibot-issues";
import { createEnv as createCoreEnv } from "@/core/create-env";
import type { SchemaAdapter } from "@/core/schema";
import type { EnvSource } from "@/core/types";

export { EnvValidationError, pickClientEnv } from "@/index";
export type { ClientEnvOptions, EnvIssue, EnvSource } from "@/core/types";

export type ValibotSchema = BaseSchema<unknown, unknown, BaseIssue<unknown>>;

export type ValibotSchemaMap = Readonly<Record<string, ValibotSchema>>;

export type InferValibotSchemaMap<TSchemas extends ValibotSchemaMap> = {
  readonly [TKey in keyof TSchemas]: InferOutput<TSchemas[TKey]>;
};

export interface ValibotCreateEnvOptions<TSchemas extends ValibotSchemaMap> {
  readonly schema: TSchemas;
  readonly source: EnvSource;
}

const valibotAdapter: SchemaAdapter<ValibotSchema, unknown> = {
  parse: (schema, input) => {
    const result = safeParse(schema, input);

    if (result.success) {
      return { ok: true, value: result.output };
    }

    return { ok: false, issues: normalizeValibotIssues(result.issues) };
  },
};

export const createEnv = <TSchemas extends ValibotSchemaMap>(
  options: ValibotCreateEnvOptions<TSchemas>,
): Readonly<InferValibotSchemaMap<TSchemas>> =>
  createCoreEnv<InferValibotSchemaMap<TSchemas>, ValibotSchema>({
    adapter: valibotAdapter,
    schema: options.schema,
    source: options.source,
  });
