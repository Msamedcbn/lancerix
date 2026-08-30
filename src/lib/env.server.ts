import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PAYMENT_PROVIDER: z.enum(["paytr", "iyzico"]),
  PAYMENT_WEBHOOK_SECRET: z.string().min(1),
  INVOICE_PROVIDER: z.enum(["parasut", "kolaybi"]),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/**
 * Parsed lazily so that a missing gateway credential fails the request that
 * needs it rather than the whole server boot.
 */
export function serverEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}
