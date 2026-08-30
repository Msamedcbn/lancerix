import { formatKurus } from "@/lib/escrow/money";

/**
 * Every amount in the interface goes through here, so a kurus integer is never
 * divided by 100 at a call site and never rendered as a bare number.
 *
 * Tabular figures are not decoration: in a column of amounts they are the
 * difference between scannable and not.
 */
export function Money({
  kurus,
  className = "",
}: Readonly<{ kurus: number; className?: string }>) {
  return (
    <span className={`tnum ${className}`} title={`${kurus} kuruş`}>
      {formatKurus(kurus)}
    </span>
  );
}
