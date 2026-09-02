import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-mono text-brand font-bold text-sm tracking-widest uppercase">
          404 Hatası
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
          Sayfa Bulunamadı
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Aradığınız sayfayı bulamadık. URL&apos;yi yanlış yazmış olabilirsiniz veya sayfa yayından kaldırılmış olabilir.
        </p>
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            <Home className="size-4" aria-hidden />
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
