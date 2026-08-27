import type { EnvSource } from "./types";

export interface AdapterIssue {
  readonly expected: string;
  readonly path?: readonly (string | number)[];
}

export interface EnvParseContext {
  readonly key: string;
  readonly source: EnvSource;
}

export interface SchemaParseFailure {
  readonly issues: readonly AdapterIssue[];
  readonly ok: false;
}

export interface SchemaParseSuccess<TOutput> {
  readonly ok: true;
  readonly value: TOutput;
}

export type SchemaParseResult<TOutput> =
  SchemaParseFailure | SchemaParseSuccess<TOutput>;

export interface SchemaAdapter<TSchema, TOutput> {
  parse(
    schema: TSchema,
    input: string | undefined,
    context: EnvParseContext,
  ): SchemaParseResult<TOutput>;
}
