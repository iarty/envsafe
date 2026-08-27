import type { AdapterIssue } from "@/core/schema";

const FALLBACK_EXPECTED_FORMAT = "a value accepted by this schema";

type ValibotIssueLike = {
  readonly expected?: unknown | undefined;
  readonly kind?: unknown | undefined;
  readonly path?:
    | readonly {
        readonly key?: unknown | undefined;
      }[]
    | undefined;
  readonly type?: unknown | undefined;
};

export const normalizeValibotIssues = (
  issues: readonly ValibotIssueLike[],
): readonly AdapterIssue[] =>
  issues.map((issue) => {
    const path = normalizePath(issue.path);

    return {
      ...(path.length === 0 ? {} : { path }),
      expected: getExpectedFormat(issue),
    };
  });

const normalizePath = (
  path: ValibotIssueLike["path"],
): readonly (string | number)[] =>
  path === undefined
    ? []
    : path.flatMap((item) => {
        const key = item.key;

        return typeof key === "string" || typeof key === "number" ? [key] : [];
      });

const getExpectedFormat = (issue: ValibotIssueLike): string => {
  if (typeof issue.expected === "string" && issue.expected.trim().length > 0) {
    return issue.expected;
  }

  if (
    typeof issue.type === "string" &&
    issue.type.length > 0 &&
    issue.type !== "custom"
  ) {
    return `a valid ${issue.type.replaceAll("_", " ")}`;
  }

  if (typeof issue.kind === "string" && issue.kind.length > 0) {
    return `a value accepted by the ${issue.kind} schema`;
  }

  return FALLBACK_EXPECTED_FORMAT;
};
