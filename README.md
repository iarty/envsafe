# @abarbonov/envsafe

Type-safe environment validation for TypeScript applications using native Zod
or Valibot schemas. The package keeps browser-safe core helpers separate from
optional validator adapters and the Node.js-only `.env` loader.

## Install

```sh
npm install @abarbonov/envsafe zod
# or: npm install @abarbonov/envsafe valibot
```

Use one validator entry point. Zod and Valibot are optional peer dependencies;
they are not imported by the root entry point.

## Validate with Zod

```ts
import { z } from "zod";
import { createEnv } from "@abarbonov/envsafe/zod";

const env = createEnv({
  schema: {
    API_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production"]),
    PORT: z.coerce.number().int().default(3000),
  },
  source: process.env,
});
```

`env` is inferred from the supplied schemas and is frozen after successful
validation. Invalid input throws `EnvValidationError` with safe, structured
issues. Raw environment values never appear in the error message.

## Validate with Valibot

```ts
import { createEnv } from "@abarbonov/envsafe/valibot";
import { fallback, pipe, string, transform, url } from "valibot";

const env = createEnv({
  schema: {
    API_URL: pipe(string(), url()),
    PORT: fallback(pipe(string(), transform(Number)), 3000),
  },
  source: process.env,
});
```

## Node `.env` loading

The Node-only subpath performs no work on import. Call `loadDotenv` explicitly
with the desired file order and target object:

```ts
import { loadDotenv } from "@abarbonov/envsafe/node";

loadDotenv({
  paths: [".env", ".env.local"],
  target: process.env,
});
```

Existing target values win by default. Set `override: true` to let later files
overwrite earlier values and existing target values. Missing files are reported
in `skippedFiles`; no environment values are returned in the summary.

## Client exposure

Client exposure is deny-by-default. Copy only explicit names or prefixes into a
new object:

```ts
import { pickClientEnv } from "@abarbonov/envsafe";

const clientEnv = pickClientEnv(process.env, {
  allow: ["API_URL"],
  prefixes: ["PUBLIC_"],
});
```

Never import `@abarbonov/envsafe/node` from frontend code or pass the complete
`process.env` object to a browser bundle. See [docs/client-exposure.md](docs/client-exposure.md).

## Examples

- [Zod validation and client allowlist](example/zod.ts)
- [Valibot validation and client allowlist](example/valibot.ts)

## ESM and CommonJS

ESM imports use the examples above. CommonJS consumers can require the same
public subpaths:

```js
const { createEnv } = require("@abarbonov/envsafe/zod");
const { loadDotenv } = require("@abarbonov/envsafe/node");
```

## Documentation

- [API reference](docs/api.md)
- [Node dotenv loading](docs/node-dotenv.md)
- [Client exposure and bundle safety](docs/client-exposure.md)
