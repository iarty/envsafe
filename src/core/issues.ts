import type { AdapterIssue } from "./schema";
import type { EnvIssue } from "./types";

const FALLBACK_EXPECTED_FORMAT = "a valid value";

export const createEnvIssue = (key: string, issue: AdapterIssue): EnvIssue => {
  const expected = normalizeExpectedFormat(issue.expected);

  return {
    ...(issue.path === undefined ? {} : { path: issue.path }),
    expected,
    key,
    message: `Expected ${expected}. Set a value that matches the expected format.`,
  };
};

const normalizeExpectedFormat = (expected: string): string => {
  const normalized = expected.trim();

  return normalized.length > 0 ? normalized : FALLBACK_EXPECTED_FORMAT;
};
