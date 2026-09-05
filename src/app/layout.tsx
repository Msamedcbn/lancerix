import type { Metadata } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";

import { appUrl } from "@/lib/env.server";
import { localeFromPath } from "@/lib/i18n/config";

import "./globals.css";

/**
 * The machine voice: timestamps, contract codes, hashes, amounts.
 */
const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-plex",
  display: "swap",
});

/**
 * The primary font used across the application for headings and body.
 * Modern, clean, and extremely legible for financial interfaces.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: "Lancerix — Sessizlik kabul sayılır",
  description:
    "Bağımsız kod doğrulama: freelancer ve ajans projelerinde teslim ile kabul arasındaki belirsizliği, kabul kriterlerine dayalı, zaman damgalı bir raporla ortadan kaldırıyoruz.",
};

/**
 * `lang` follows the URL: the public pages have an English mirror under /en
 * and everything else is Turkish. The pathname arrives as the x-pathname
 * header the middleware sets, since a layout cannot read the path any other
 * way. Reading a header makes this layout dynamic, which is why the header is
 * only consulted for this one attribute.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get("x-pathname") ?? "/";

  return (
    <html
      lang={localeFromPath(pathname)}
      suppressHydrationWarning
      className={`${mono.variable} ${jakarta.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
