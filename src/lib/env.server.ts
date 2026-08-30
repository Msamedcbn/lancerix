import "server-only";

import { z } from "zod";

/**
 * Only what the code actually reads today. The payment gateway and e-invoicing
 * credentials are deliberately absent: no code integrates them yet, and a
 * schema that demands them would make the admin client below fail for a
 * missing PayTR setting it never uses. They get their own schema when the
 * webhook route that needs them is written.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
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
