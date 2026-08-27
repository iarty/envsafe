import { describe, expect, it } from "vitest";
import { EnvValidationError } from "@/core/errors";

describe("EnvValidationError", () => {
  it("formats an aggregated error without secret values", () => {
    const secret = "database-password-must-not-leak";
    const error = new EnvValidationError([
      {
        expected: "a URL",
        key: "API_URL",
        message:
          "Expected a URL. Set a value that matches the expected format.",
      },
      {
        expected: "a number",
        key: "PORT",
        message:
          "Expected a number. Set a value that matches the expected format.",
      },
    ]);

    expect(error.message).toBe(
      "Environment validation failed for 2 variables: API_URL (a URL), PORT (a number).",
    );
    expect(JSON.stringify(error)).not.toContain(secret);
    expect(error.issues).toHaveLength(2);
    expect(error.issues.map((issue) => issue.key)).toEqual(["API_URL", "PORT"]);
  });

  it("preserves an internal cause without adding it to the public message", () => {
    const cause = new Error("adapter failure");
    const error = new EnvValidationError(
      [
        {
          expected: "a valid value",
          key: "PORT",
          message:
            "Expected a valid value. Set a value that matches the expected format.",
        },
      ],
      { cause },
    );

    expect(error.cause).toBe(cause);
    expect(error.message).not.toContain(cause.message);
  });
});
