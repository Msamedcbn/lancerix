import { MARK_DOT, MARK_PATH_D } from "@/components/brand/mark";

/**
 * Shared render for src/app/opengraph-image.tsx (Turkish default) and
 * src/app/en/opengraph-image.tsx (English override for everything under
 * /en) -- one visual definition so the two locale variants cannot drift
 * apart, with only the subtitle string differing between call sites.
 *
 * Colors are the real --brand / --background / --foreground values from
 * globals.css, converted from oklch() to hex because satori (the renderer
 * behind next/og's ImageResponse) does not understand oklch(). Recompute
 * with the same formula in the CLAUDE.md money-math sense of "one source of
 * truth" if those tokens ever change: brand oklch(0.55 0.25 260) -> #0060ff,
 * dark background oklch(0.129 0.042 264.695) -> #020618.
 *
 * The mark itself is the exact path data from src/components/brand/mark.tsx,
 * not a redrawn approximation -- satori supports plain SVG path elements, so
 * there is no reason for the two to be able to disagree.
 */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };

export function renderOgImage(subtitle: string) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#020618",
      }}
    >
      <svg width="108" height="108" viewBox="0 0 24 24" fill="none">
        <path d={MARK_PATH_D} stroke="#f8fafc" strokeWidth="1.6" strokeLinecap="butt" />
        <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill="#0060ff" />
      </svg>
      <div
        style={{
          marginTop: 28,
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "#f8fafc",
          display: "flex",
        }}
      >
        Lancerix
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 32,
          color: "#94a3b8",
          display: "flex",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}
