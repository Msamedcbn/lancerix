import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Lancerix — Emeğinizin karşılığı zamanında",
  description:
    "Kurumsal müşterilerden alacağınız 90 gün beklemesin. Sözleşme, kilitli ödeme ve otomatik serbest bırakma tek yerde.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        {/* Satoshi is a Fontshare face, not a Google font, so it cannot go
            through next/font/google. Preconnect keeps the handshake off the
            critical path; the stack below falls back cleanly if it fails. */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
