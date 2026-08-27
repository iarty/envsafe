export type EnvSource = Readonly<Record<string, string | undefined>>;

export interface EnvIssue {
  readonly expected: string;
  readonly key: string;
  readonly message: string;
  readonly path?: readonly (string | number)[];
}

export interface ClientEnvOptions {
  readonly allow?: readonly string[];
  readonly prefixes?: readonly string[];
}
