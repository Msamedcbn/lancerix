import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Next.js only inlines NEXT_PUBLIC_* when accessed as a static property path,
// so these cannot be read off a dynamic `process.env` spread.
const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

function describeFailure(error: z.ZodError): string {
  const names = error.issues.map((issue) => issue.path.join("."));
  return [
    `Missing or invalid environment variables: ${names.join(", ")}`,
    "",
    "Copy .env.example to .env.local and fill it in. The Supabase values are at",
    "Project Settings -> Data API (URL) and Project Settings -> API Keys (anon key).",
  ].join("\n");
}

/**
 * False when Supabase credentials are absent. Only ever true-or-false in
 * development: a production build with missing credentials throws below rather
 * than starting up in a degraded state.
 */
export const isSupabaseConfigured = parsed.success;

if (!parsed.success) {
  const message = describeFailure(parsed.error);

  if (process.env.NODE_ENV === "production") {
    throw new Error(message);
  }

  console.warn(
    `\n[env] ${message}\n\n` +
      "Running without Supabase: auth and database routes are disabled, and\n" +
      "the auth middleware is bypassed so static pages still render.\n",
  );
}

/**
 * In development without credentials these are unusable placeholders, guarded
 * by `isSupabaseConfigured` at every call site that would hit the network.
 */
export const env = parsed.success
  ? parsed.data
  : {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "http://supabase.invalid",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "unconfigured",
    };

export type PublicEnv = z.infer<typeof publicEnvSchema>;
