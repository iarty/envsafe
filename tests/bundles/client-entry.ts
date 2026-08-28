import { pickClientEnv } from "@abarbonov/envsafe";
import { createEnv } from "@abarbonov/envsafe/zod";
import { z } from "zod";

const source = {
  PUBLIC_API_URL: "https://example.test",
};

const validated = createEnv({
  schema: {
    PUBLIC_API_URL: z.string().url(),
  },
  source,
});

export const clientEnv = pickClientEnv(validated, {
  allow: ["PUBLIC_API_URL"],
});
