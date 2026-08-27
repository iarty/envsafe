import type { EnvIssue } from "./types";

export class EnvValidationError extends Error {
  readonly issues: readonly EnvIssue[];

  constructor(issues: readonly EnvIssue[], options?: ErrorOptions) {
    super(formatValidationMessage(issues), options);

    this.name = "EnvValidationError";
    this.issues = Object.freeze([...issues]);
  }
}

const formatValidationMessage = (issues: readonly EnvIssue[]): string => {
  if (issues.length === 0) {
    return "Environment validation failed.";
  }

  const summaries = issues.map(({ expected, key }) => `${key} (${expected})`);
  const variableLabel = issues.length === 1 ? "variable" : "variables";

  return `Environment validation failed for ${issues.length} ${variableLabel}: ${summaries.join(", ")}.`;
};
