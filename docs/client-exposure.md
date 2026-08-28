# Client Exposure and Bundle Safety

Treat browser configuration as an explicit allowlist. Validate server values
on the server, then copy only values intended for the client:

```ts
const clientEnv = pickClientEnv(env, {
  allow: ["PUBLIC_API_URL"],
  prefixes: ["PUBLIC_"],
});
```

`pickClientEnv` returns a new frozen object. It does not spread or serialize
the source and does not expose values merely because they follow a naming
convention. Keep secrets such as database credentials, signing keys, and
private tokens out of the allowlist.

## Entry-point boundary

Frontend code may import the root, Zod, or Valibot entry point. Do not import
`@abarbonov/envsafe/node` in frontend code: it is a Node.js-only subpath for
reading files and process environment values. The package export map has no
browser fallback for that subpath, so browser resolution fails predictably.

## Defence in depth

The project verifies the boundary at build time. Browser fixtures assert that
client output contains no `dotenv`, Node built-ins, Node loader identifiers, or
test secret markers. Validator isolation checks ensure a Zod build does not pull
Valibot and a Valibot build does not pull Zod.

The library never logs environment values. Validation and loading errors expose
variable names, expected formats, and safe remediation hints only.
