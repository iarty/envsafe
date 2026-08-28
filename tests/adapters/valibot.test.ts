import { describe, expect, expectTypeOf, it } from "vitest";
import {
  fallback,
  optional,
  pipe,
  regex,
  string,
  transform,
  url,
  type BaseIssue,
  type BaseSchema,
} from "valibot";
import { normalizeValibotIssues } from "@/adapters/internal/normalize-valibot-issues";
import { createEnv } from "@/adapters/valibot";
import { runAdapterContractTests } from "./contract";

type ValibotTestSchema = BaseSchema<unknown, unknown, BaseIssue<unknown>>;

const valibotSchemas = {
  defaultedPort: () => fallback(pipe(string(), transform(Number)), 3000),
  optionalString: () => optional(string()),
  requiredUrl: () => pipe(string(), url()),
  transformedPort: () => pipe(string(), transform(Number)),
  validPort: () => pipe(string(), regex(/^\d+$/)),
};

runAdapterContractTests<ValibotTestSchema>("Valibot", {
  createEnv: (options) => createEnv(options),
  schemas: valibotSchemas,
});

describe("Valibot adapter", () => {
  it("infers the parsed object type", () => {
    const env = createEnv({
      schema: {
        API_URL: pipe(string(), url()),
        PORT: fallback(pipe(string(), transform(Number)), 3000),
      },
      source: { API_URL: "https://example.test" },
    });

    expectTypeOf(env).toEqualTypeOf<
      Readonly<{ API_URL: string; PORT: number }>
    >();
    expect(env).toEqual({ API_URL: "https://example.test", PORT: 3000 });
  });

  it("normalizes nested paths without copying raw issue fields", () => {
    const issue = {
      kind: "validation",
      type: "regex",
      expected: "a string matching a pattern",
      input: "database-password-must-not-leak",
      received: '"database-password-must-not-leak"',
      message: "Invalid pattern",
      path: [
        {
          type: "object",
          origin: "key",
          input: { config: { PORT: "database-password-must-not-leak" } },
          key: "config",
          value: { PORT: "database-password-must-not-leak" },
        },
        {
          type: "object",
          origin: "key",
          input: { PORT: "database-password-must-not-leak" },
          key: "PORT",
          value: "database-password-must-not-leak",
        },
      ],
      requirement: /^\d+$/,
    } as never;

    const normalized = normalizeValibotIssues([issue]);

    expect(normalized).toEqual([
      {
        expected: "a string matching a pattern",
        path: ["config", "PORT"],
      },
    ]);
    expect(JSON.stringify(normalized)).not.toContain(
      "database-password-must-not-leak",
    );
  });

  it("derives a safe expected format when Valibot omits expected", () => {
    expect(
      normalizeValibotIssues([
        {
          kind: "validation",
          type: "email",
          expected: null,
          path: undefined,
        },
      ]),
    ).toEqual([{ expected: "a valid email" }]);
  });
});
