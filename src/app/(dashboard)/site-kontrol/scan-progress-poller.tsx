"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 4000;

/**
 * Refreshes the page every few seconds while a scan is still filling in, so
 * a customer watching an order complete sees modules appear on their own --
 * no "sayfayı birazdan yenile" instruction, no manual reload. Each module's
 * report row is saved the moment that module finishes (runScanForPaidOrder),
 * so this is a real progression, not a simulated one.
 *
 * Renders nothing; it only exists for the interval effect. Stops itself the
 * moment the server re-renders with active=false -- once every module in
 * the package has a row, there is nothing left to poll for.
 */
export function ScanProgressPoller({ active }: Readonly<{ active: boolean }>) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [active, router]);

  return null;
}
