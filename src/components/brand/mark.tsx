/**
 * The Lancerix mark.
 *
 * An arc that has travelled 285 degrees and stopped, with a filled terminal
 * where it stopped. It is the objection window: open while it runs, closed at
 * the point marked in green. The whole product is one idea -- a period that
 * expires into a binding fact -- and the mark is that idea and nothing else.
 *
 * Butt caps, not round: this is a ruled instrument, not a friendly app icon.
 * It survives 16px because it is one stroke and one dot.
 */
export function Mark({
  className = "",
  title,
}: Readonly<{ className?: string; title?: string }>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        d="M12 4 A 8 8 0 1 1 4.273 9.930"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="butt"
      />
      <circle cx="4.273" cy="9.93" r="1.85" className="fill-brand" />
    </svg>
  );
}

/** Mark plus name, locked up. Never set the two by hand at a call site. */
export function Wordmark({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className="size-[1.15em] shrink-0" />
      <span className="font-semibold tracking-[-0.02em]">Lancerix</span>
    </span>
  );
}
