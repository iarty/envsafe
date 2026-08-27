import { describe, expect, it } from "vitest";
import { createEnv, EnvValidationError } from "../../src/index";
import type { SchemaAdapter } from "../../src/index";

interface TestSchema {
  readonly expected: string;
  readonly parse: (input: string | undefined) => unknown;
}

const testAdapter: SchemaAdapter<TestSchema, unknown> = {
  parse(schema, input) {
    if (input === undefined) {
      return {
        issues: [{ expected: schema.expected }],
        ok: false,
      };
    }

    return {
      ok: true,
      value: schema.parse(input),
    };
  },
};

describe("createEnv", () => {
  it("returns an immutable typed output when every schema parses", () => {
    const env = createEnv<{ API_URL: string; PORT: number }, TestSchema>({
      adapter: testAdapter,
      schema: {
        API_URL: {
          expected: "a URL",
          parse: (input) => new URL(input ?? "").toString(),
        },
        PORT: { expected: "a number", parse: (input) => Number(input) },
      },
      source: {
        API_URL: "https://example.test",
        PORT: "3000",
      },
    });

    expect(env).toEqual({ API_URL: "https://example.test/", PORT: 3000 });
    expect(Object.isFrozen(env)).toBe(true);
  });

  it("aggregates schema issues without exposing source values", () => {
    const secret = "database-password-must-not-leak";

    expect(() =>
      createEnv<{ API_URL: string; DATABASE_URL: string }, TestSchema>({
        adapter: testAdapter,
        schema: {
          API_URL: { expected: "a URL", parse: (input) => input },
          DATABASE_URL: { expected: "a URL", parse: (input) => input },
        },
        source: { DATABASE_URL: secret },
      }),
    ).toThrow(EnvValidationError);

    try {
      createEnv<{ API_URL: string; DATABASE_URL: string }, TestSchema>({
        adapter: testAdapter,
        schema: {
          API_URL: { expected: "a URL", parse: (input) => input },
          DATABASE_URL: { expected: "a URL", parse: (input) => input },
        },
        source: { DATABASE_URL: secret },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const validationError = error as EnvValidationError;

      expect(validationError.issues.map((issue) => issue.key)).toEqual([
        "API_URL",
      ]);
      expect(validationError.message).not.toContain(secret);
      expect(JSON.stringify(validationError)).not.toContain(secret);
    }
  });

  it("normalizes an unexpected adapter error without exposing source values", () => {
    const secret = "database-password-must-not-leak";
    const cause = new Error(`adapter failed: ${secret}`);
    const throwingAdapter: SchemaAdapter<TestSchema, unknown> = {
      parse: () => {
        throw cause;
      },
    };

    try {
      createEnv<{ DATABASE_URL: string }, TestSchema>({
        adapter: throwingAdapter,
        schema: {
          DATABASE_URL: { expected: "a URL", parse: (input) => input },
        },
        source: { DATABASE_URL: secret },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const validationError = error as EnvValidationError;

      expect(validationError).not.toHaveProperty("cause");
      expect(validationError.message).not.toContain(secret);
      expect(validationError.message).not.toContain(cause.message);
      expect(JSON.stringify(validationError)).not.toContain(secret);
    }
  });
});
