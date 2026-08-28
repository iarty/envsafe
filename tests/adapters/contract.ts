import { describe, expect, it } from "vitest";
import { EnvValidationError } from "@/index";
import type { EnvSource } from "@/index";

interface AdapterContractSchemas<TSchema> {
  readonly defaultedPort: () => TSchema;
  readonly optionalString: () => TSchema;
  readonly requiredUrl: () => TSchema;
  readonly transformedPort: () => TSchema;
  readonly validPort: () => TSchema;
}

interface AdapterContract<TSchema> {
  readonly createEnv: (options: {
    readonly schema: Readonly<Record<string, TSchema>>;
    readonly source: EnvSource;
  }) => unknown;
  readonly schemas: AdapterContractSchemas<TSchema>;
}

const getValidationError = (execute: () => unknown): EnvValidationError => {
  try {
    execute();
  } catch (error) {
    expect(error).toBeInstanceOf(EnvValidationError);

    return error as EnvValidationError;
  }

  throw new Error("Expected environment validation to fail.");
};

export const runAdapterContractTests = <TSchema>(
  name: string,
  adapter: AdapterContract<TSchema>,
): void => {
  describe(`${name} adapter contract`, () => {
    it("handles required and optional values", () => {
      const env = adapter.createEnv({
        schema: {
          API_URL: adapter.schemas.requiredUrl(),
          OPTIONAL_LABEL: adapter.schemas.optionalString(),
        },
        source: { API_URL: "https://example.test" },
      });

      expect(env).toEqual({
        API_URL: "https://example.test",
        OPTIONAL_LABEL: undefined,
      });
    });

    it("applies defaults and transformations", () => {
      const env = adapter.createEnv({
        schema: {
          PORT: adapter.schemas.defaultedPort(),
          RETRIES: adapter.schemas.transformedPort(),
        },
        source: { RETRIES: "3" },
      });

      expect(env).toEqual({ PORT: 3000, RETRIES: 3 });
    });

    it("returns a frozen result after successful validation", () => {
      const env = adapter.createEnv({
        schema: { PORT: adapter.schemas.validPort() },
        source: { PORT: "8080" },
      });

      expect(Object.isFrozen(env)).toBe(true);
    });

    it("aggregates invalid variables without exposing secrets", () => {
      const secret = "database-password-must-not-leak";
      const error = getValidationError(() =>
        adapter.createEnv({
          schema: {
            DATABASE_URL: adapter.schemas.requiredUrl(),
            PORT: adapter.schemas.validPort(),
          },
          source: { DATABASE_URL: secret, PORT: "not-a-number" },
        }),
      );

      expect(error.issues.map((issue) => issue.key)).toEqual([
        "DATABASE_URL",
        "PORT",
      ]);
      expect(error.message).not.toContain(secret);
      expect(JSON.stringify(error)).not.toContain(secret);
    });
  });
};
