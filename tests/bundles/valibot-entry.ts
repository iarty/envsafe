import { createEnv } from "@abarbonov/envsafe/valibot";
import { pickClientEnv } from "@abarbonov/envsafe";
import { pipe, string, url } from "valibot";

const validated = createEnv({
  schema: {
    PUBLIC_API_URL: pipe(string(), url()),
  },
  source: {
    PUBLIC_API_URL: "https://example.test",
  },
});

export const clientEnv = pickClientEnv(validated, {
  allow: ["PUBLIC_API_URL"],
});
