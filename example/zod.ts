import { pickClientEnv } from "@abarbonov/envsafe";
import { createEnv } from "@abarbonov/envsafe/zod";
import { z } from "zod";

export const env = createEnv({
  schema: {
    API_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "production"]),
    PORT: z.coerce.number().int().positive().default(3000),
  },
  source: process.env,
});

export const clientEnv = pickClientEnv(process.env, {
  allow: ["API_URL"],
});
