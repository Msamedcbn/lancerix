import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";

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
  title: "Lancerix — Sessizlik kabul sayılır",
  description:
    "Kurumsal müşteriden alacağın 90 gün beklemesin. İmzalı sözleşme, aşamalı teslim ve süresi dolduğunda kendiliğinden gerçekleşen kabul — hepsi silinemeyen bir deftere yazılır.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${mono.variable} ${jakarta.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
