import { describe, expect, it } from "vitest";
import { pickClientEnv } from "@/index";

describe("pickClientEnv", () => {
  const source = {
    DATABASE_URL: "database-password-must-not-leak",
    PUBLIC_API_URL: "https://example.test",
    PUBLIC_ANALYTICS_ID: "analytics-id",
  };

  it.each([
    {
      expected: { PUBLIC_API_URL: "https://example.test" },
      options: { allow: ["PUBLIC_API_URL"] },
    },
    {
      expected: {
        PUBLIC_ANALYTICS_ID: "analytics-id",
        PUBLIC_API_URL: "https://example.test",
      },
      options: { prefixes: ["PUBLIC_"] },
    },
    {
      expected: {},
      options: {},
    },
  ])(
    "returns only explicitly approved client values",
    ({ expected, options }) => {
      const env = pickClientEnv(source, options);

      expect(env).toEqual(expected);
      expect(env).not.toHaveProperty("DATABASE_URL");
      expect(Object.isFrozen(env)).toBe(true);
    },
  );

  it("rejects an empty prefix because it would expose every value", () => {
    expect(() => pickClientEnv(source, { prefixes: [""] })).toThrow(
      "Client prefixes must not include an empty string.",
    );
  });
});
