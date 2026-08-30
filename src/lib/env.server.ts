import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PAYMENT_PROVIDER: z.enum(["paytr", "iyzico"]),
  PAYMENT_WEBHOOK_SECRET: z.string().min(1),
  INVOICE_PROVIDER: z.enum(["parasut", "kolaybi"]),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Absolute origin for links that are emailed to users, such as the magic-link
 * callback. Server-only: it is never read in the browser, so it does not need
 * to be inlined into the client bundle.
 *
 * Explicit APP_URL wins, which is what a custom domain uses. On Vercel it
 * falls back to the project's stable production domain, then to the
 * per-deployment URL so previews link to themselves. Locally it is localhost.
 * Nothing has to be configured for a Vercel deploy to link to itself.
 */
export function appUrl(): string {
  const explicit = process.env.APP_URL;
  if (explicit) {
    const parsed = z.url().safeParse(explicit);
    if (!parsed.success) {
      throw new Error(`APP_URL must be an absolute URL, got "${explicit}"`);
    }
    return new URL(parsed.data).origin;
  }

  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (host) return `https://${host}`;

  return "http://localhost:3000";
}

let cached: ServerEnv | null = null;

/**
 * Parsed lazily so that a missing gateway credential fails the request that
 * needs it rather than the whole server boot.
 */
export function serverEnv(): ServerEnv {
  cached ??= serverEnvSchema.parse(process.env);
  return cached;
}
