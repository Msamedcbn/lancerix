import Link from 'next/link';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-14">
          <Link href="/" className="text-[0.95rem] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Lancerix
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors">
              Giriş Yap
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 py-8 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
