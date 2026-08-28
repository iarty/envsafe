# API Reference

## `createEnv`

Import `createEnv` from `@abarbonov/envsafe/zod` or
`@abarbonov/envsafe/valibot`. Each adapter accepts native schemas:

```ts
const env = createEnv({
  schema: {
    API_URL: z.string().url(),
  },
  source: { API_URL: "https://example.test" },
});
```

`source` is a read-only record of strings and optional values. The result is a
frozen object whose property types are inferred from the schema map. Required,
optional, defaulted, and transformed values follow the selected validator's
semantics.

## Errors

Invalid input throws `EnvValidationError` from the root or adapter entry point.
Its `issues` array contains `key`, `expected`, `message`, and, when useful,
`path`. Issues are aggregated across schema keys. Messages contain remediation
hints but never raw input values or secrets.

## `pickClientEnv`

```ts
pickClientEnv(source, {
  allow?: readonly string[],
  prefixes?: readonly string[],
});
```

The function creates a new frozen object. `allow` matches exact names and
`prefixes` matches explicit prefixes. An empty prefix is rejected. No implicit
enumeration of `process.env` occurs in the browser-safe API.

## Public subpaths

| Subpath                      | Purpose                                  |
| ---------------------------- | ---------------------------------------- |
| `@abarbonov/envsafe`         | Browser-safe core helpers and types      |
| `@abarbonov/envsafe/zod`     | Zod adapter and inferred `createEnv`     |
| `@abarbonov/envsafe/valibot` | Valibot adapter and inferred `createEnv` |
| `@abarbonov/envsafe/node`    | Node-only `.env` loader                  |

All supported subpaths provide ESM and CommonJS builds plus generated
declarations.
