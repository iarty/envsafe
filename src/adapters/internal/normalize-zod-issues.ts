import type { AdapterIssue } from "@/core/schema";

const FALLBACK_EXPECTED_FORMAT = "a value accepted by this schema";

type ZodIssueLike = {
  readonly code: string;
  readonly path: readonly PropertyKey[];
  readonly expected?: unknown;
  readonly format?: unknown;
  readonly validation?: unknown;
};

export const normalizeZodIssues = (
  issues: readonly ZodIssueLike[],
): readonly AdapterIssue[] =>
  issues.map((issue) => {
    const path = issue.path.filter(
      (segment): segment is string | number =>
        typeof segment === "string" || typeof segment === "number",
    );

    return {
      ...(path.length === 0 ? {} : { path }),
      expected: getExpectedFormat(issue),
    };
  });

const getExpectedFormat = (issue: ZodIssueLike): string => {
  const { expected } = issue;

  if (typeof expected === "string" && expected.length > 0) {
    return expected;
  }

  const format = getStringFormat(issue);

  if (format !== undefined) {
    return `a valid ${format.replaceAll("_", " ")}`;
  }

  switch (issue.code) {
    case "too_big":
      return "a value within the maximum allowed size";
    case "too_small":
      return "a value within the minimum allowed size";
    default:
      return FALLBACK_EXPECTED_FORMAT;
  }
};

const getStringFormat = (issue: ZodIssueLike): string | undefined => {
  const { format } = issue;

  if (typeof format === "string") {
    return format;
  }

  const { validation } = issue;

  return typeof validation === "string" ? validation : undefined;
};
