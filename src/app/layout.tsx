import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

/**
 * The machine voice: timestamps, contract codes, hashes, amounts. Nothing a
 * person wrote ever sits in this face, so the reader can tell at a glance
 * what the system asserted versus what we merely claimed.
 */
const mono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-mono-plex",
  display: "swap",
});

/**
 * The one place this page spends a font choice. A high-contrast serif on
 * headlines instead of another rounded geometric sans -- Satoshi, Inter,
 * Outfit, Cabinet Grotesk are the same four fonts every AI-generated landing
 * page reaches for, and the sameness is part of what reads as generated. The
 * body stays on plain system sans; one considered choice plus one boring,
 * honest one, rather than two competing "designed" fonts.
 */
const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
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
      className={`${mono.variable} ${display.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
