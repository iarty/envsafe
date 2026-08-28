import { pickClientEnv } from "@abarbonov/envsafe";
import { createEnv } from "@abarbonov/envsafe/valibot";
import {
  fallback,
  number,
  picklist,
  pipe,
  string,
  transform,
  url,
} from "valibot";

export const env = createEnv({
  schema: {
    API_URL: pipe(string(), url()),
    NODE_ENV: picklist(["development", "production"]),
    PORT: fallback(pipe(string(), transform(Number), number()), 3000),
  },
  source: process.env,
});

export const clientEnv = pickClientEnv(process.env, {
  allow: ["API_URL"],
});
