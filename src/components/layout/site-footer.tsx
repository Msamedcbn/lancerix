import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

const BRAND = "Lancerix";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border bg-background pt-16 pb-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand & Tagline */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <Mark className="text-brand size-6" title={BRAND} />
              <span className="font-semibold tracking-tight text-foreground text-lg">{BRAND}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Yazılım projelerindeki teslimat ve onay süreçlerini güvene alan, şeffaf ve bağımsız kod doğrulama altyapısı.
            </p>
            <div className="mt-6 flex items-center gap-4 text-muted-foreground">
              <a href="#" className="hover:text-brand transition-colors" aria-label="Twitter">
                <Twitter className="size-5" />
              </a>
              <a href="#" className="hover:text-brand transition-colors" aria-label="GitHub">
                <Github className="size-5" />
              </a>
              <a href="#" className="hover:text-brand transition-colors" aria-label="LinkedIn">
                <Linkedin className="size-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Ürün</h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <li>
                <Link href="/#nasil" className="hover:text-foreground transition-colors">Nasıl Çalışır?</Link>
              </li>
              <li>
                <Link href="/#fiyat" className="hover:text-foreground transition-colors">Doğrulama Yöntemleri</Link>
              </li>
              <li>
                <Link href="/nasil-calisir" className="hover:text-foreground transition-colors">Sistem Şeması</Link>
              </li>
              <li>
                <Link href="/yol-haritasi" className="hover:text-foreground transition-colors">Yol Haritası (Neredeyiz?)</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">Giriş Yap</Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">Yasal</h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <li>
                <Link href="/sartlar" className="hover:text-foreground transition-colors">Şartlar ve Koşullar</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">İletişim</h3>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <li>
                <a href="mailto:hello@lancerix.com" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="size-4" />
                  hello@lancerix.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row text-xs text-muted-foreground">
          <p>© {currentYear} {BRAND}. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-2">
            <span>Türkiye&apos;de <span className="text-brand">❤</span> ile geliştirildi</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
