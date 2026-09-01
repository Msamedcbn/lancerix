import Link from "next/link";

import { Mark } from "@/components/brand/mark";
import { HOME_FOR, optionalSession } from "@/lib/auth/session";

/**
 * The public profile shell.
 *
 * The header branches on whether anyone is signed in. It used to offer
 * "Giriş Yap" unconditionally, which meant a freelancer opening their own
 * profile was shown a login link and no way back to their dashboard -- the
 * product treating its own user as a stranger.
 */
export default async function ProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await optionalSession();

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-[0.95rem] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
          >
            <Mark className="text-brand size-4" />
            Lancerix
          </Link>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <span className="hidden text-sm text-zinc-500 sm:inline dark:text-zinc-400">
                  {session.fullName}
                </span>
                <Link
                  href={HOME_FOR[session.role]}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                >
                  Panele dön
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 py-8 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
