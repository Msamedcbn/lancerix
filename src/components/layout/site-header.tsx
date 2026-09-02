import Link from "next/link";
import { Mark } from "@/components/brand/mark";

const BRAND = "Lancerix";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Mark className="text-brand size-5" title={BRAND} />
          <span className="font-semibold tracking-tight text-foreground">{BRAND}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/#nasil" className="hover:text-foreground transition-colors">Nasıl çalışır</Link>
          <Link href="/#fiyat" className="hover:text-foreground transition-colors">Fiyatlandırma</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden text-sm font-medium text-foreground hover:opacity-80 md:block transition-opacity">
            Giriş yap
          </Link>
          <Link href="/register" className="bg-brand text-brand-foreground rounded-xl px-4 py-2 text-sm font-medium shadow-sm hover:opacity-90 transition-opacity active:scale-[0.98]">
            Hesap oluştur
          </Link>
        </div>
      </div>
    </header>
  );
}
