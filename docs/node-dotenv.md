# Node `.env` Loading

Import the Node-only entry point only from server-side code:

```ts
import { loadDotenv } from "@abarbonov/envsafe/node";

const summary = loadDotenv({
  paths: [".env", ".env.local", ".env.production"],
  target: process.env,
});
```

Files are read and parsed in the order supplied. By default, an existing target
value is preserved, so values supplied by the process environment take
precedence over files. With `override: true`, every parsed file may overwrite
an existing value and the last file wins.

The result contains only safe metadata:

- `loadedFiles`: paths that were read;
- `loadedKeys`: number of assignments applied;
- `skippedFiles`: missing paths.

Missing files are skipped. Other read failures throw `DotenvLoadError` with the
file path, without including file contents or environment values. The loader
does not automatically read conventional `.env` filenames on import.

After loading, pass the target to a validator adapter explicitly:

```ts
const env = createEnv({ schema, source: process.env });
```

This lets each package in a monorepo choose its own files and validation
boundary.
