"use client";

/**
 * Three soft light beams sweeping behind the hero glass. CSS, not GSAP — this
 * is predetermined, looping motion, and a CSS animation keeps running on the
 * compositor while the rest of the page is busy loading fonts and hydrating.
 * Two tones only (brand green, cool violet) so it reads as a considered pair
 * of studio lights, not a rainbow gradient generator default.
 */
export function Beams({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="beam beam-a absolute top-[-20%] left-[8%] h-[140%] w-[46%] rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand)_38%,transparent),transparent_70%)] blur-[90px]" />
      <div className="beam beam-b absolute top-[-10%] right-[4%] h-[130%] w-[40%] rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent-violet)_42%,transparent),transparent_70%)] blur-[100px]" />
      <div className="beam beam-c absolute top-[30%] left-[38%] h-[80%] w-[30%] rounded-[50%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand)_22%,transparent),transparent_70%)] blur-[110px]" />
    </div>
  );
}
