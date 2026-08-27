import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { normalizeZodIssues } from "@/adapters/internal/normalize-zod-issues";
import { createEnv } from "@/adapters/zod";
import { runAdapterContractTests } from "./contract";

type UrlSchema = z.ZodType<string>;
type UrlSchemaFactory = () => UrlSchema;

const createUrlSchema = (): UrlSchema => {
  const urlFactory = (z as { readonly url?: UrlSchemaFactory }).url;

  if (urlFactory !== undefined) {
    return urlFactory();
  }

  // Zod 3 has no top-level URL schema factory.
  const legacyStringSchema = z.string() as unknown as {
    readonly url: UrlSchemaFactory;
  };

  return legacyStringSchema["url"]();
};

const zodSchemas = {
  defaultedPort: () => z.coerce.number().default(3000),
  optionalString: () => z.string().optional(),
  requiredUrl: createUrlSchema,
  transformedPort: () => z.string().transform((value) => Number(value)),
  validPort: () => z.string().regex(/^\d+$/),
};

runAdapterContractTests<z.ZodType>("Zod", {
  createEnv: (options) => createEnv(options),
  schemas: zodSchemas,
});

describe("Zod adapter", () => {
  it("normalizes the Zod 3 invalid_string validation field", () => {
    const legacyIssue = {
      code: "invalid_string",
      validation: "email",
      path: ["CONTACT_EMAIL"],
      message: "Invalid email",
    } as never;

    expect(normalizeZodIssues([legacyIssue])).toEqual([
      {
        expected: "a valid email",
        path: ["CONTACT_EMAIL"],
      },
    ]);
  });

  it("normalizes the Zod 4 invalid_format field", () => {
    const currentIssue = {
      code: "invalid_format",
      format: "url",
      path: [],
      message: "Invalid URL",
    } as never;

    expect(normalizeZodIssues([currentIssue])).toEqual([
      { expected: "a valid url" },
    ]);
  });

  it("infers the parsed object type", () => {
    const env = createEnv({
      schema: {
        API_URL: createUrlSchema(),
        PORT: z.coerce.number().default(3000),
      },
      source: { API_URL: "https://example.test" },
    });

    expectTypeOf(env).toEqualTypeOf<
      Readonly<{ API_URL: string; PORT: number }>
    >();
    expect(env).toEqual({ API_URL: "https://example.test", PORT: 3000 });
  });

  it("keeps nested Zod paths while omitting Zod messages", () => {
    const result = z
      .object({ config: z.object({ PORT: z.string().regex(/^\d+$/) }) })
      .safeParse({ config: { PORT: "not-a-number" } });

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(normalizeZodIssues(result.error.issues)).toEqual([
      {
        expected: "a valid regex",
        path: ["config", "PORT"],
      },
    ]);
  });
});
