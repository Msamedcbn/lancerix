"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";

type Slice = {
  title: string;
  body: string;
  icon: LucideIcon;
};

const THEME = {
  dark: {
    panel: "glass",
    icon: "text-zinc-500",
    iconActive: "text-brand",
    title: "text-white",
    body: "text-zinc-400",
    glow: "bg-[radial-gradient(120%_100%_at_20%_100%,color-mix(in_oklab,var(--brand)_22%,transparent),transparent_65%)]",
  },
  light: {
    panel: "border border-slate-200 bg-white/70 backdrop-blur-xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
    icon: "text-slate-400",
    iconActive: "text-brand",
    title: "text-slate-900",
    body: "text-slate-500",
    glow: "bg-[radial-gradient(120%_100%_at_20%_100%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent_65%)]",
  },
} as const;

/**
 * Vertical slices that widen on hover/focus to reveal their body copy. Width
 * is the one layout property the accordion recipe tolerates — there is no
 * transform equivalent for "this panel is now wider than that one." Every
 * slice stays keyboard-reachable as a real button, so focus does the same job
 * hover does rather than being a mouse-only party trick.
 */
export function HorizontalAccordion({
  slices,
  theme = "dark",
}: Readonly<{ slices: readonly Slice[]; theme?: "dark" | "light" }>) {
  const [active, setActive] = useState(0);
  const t = THEME[theme];

  return (
    <div className="flex h-[26rem] w-full gap-2 overflow-hidden rounded-2xl md:h-[30rem]">
      {slices.map((slice, i) => {
        const isActive = i === active;
        const Icon = slice.icon;
        return (
          <button
            key={slice.title}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            aria-expanded={isActive}
            className={`group relative flex shrink-0 flex-col justify-end overflow-hidden rounded-2xl p-5 text-left transition-[flex-grow] duration-500 [transition-timing-function:var(--ease-out-quint)] ${t.panel} ${
              isActive ? "flex-[5]" : "flex-[1]"
            }`}
            style={{ minWidth: isActive ? undefined : "3.75rem" }}
          >
            <div
              aria-hidden
              className={`absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 ${t.glow} ${
                isActive ? "opacity-100" : ""
              }`}
            />

            <Icon
              className={`mb-4 size-5 shrink-0 transition-colors duration-300 ${isActive ? t.iconActive : t.icon}`}
              strokeWidth={1.75}
            />

            <span
              className={`text-[0.95rem] leading-tight font-medium whitespace-nowrap transition-[writing-mode] ${t.title} ${
                isActive ? "" : "[writing-mode:vertical-rl]"
              }`}
            >
              {slice.title}
            </span>

            <p
              className={`mt-3 max-w-xs text-sm leading-relaxed transition-opacity duration-300 ${t.body} ${
                isActive ? "opacity-100 delay-150" : "pointer-events-none opacity-0"
              }`}
            >
              {slice.body}
            </p>
          </button>
        );
      })}
    </div>
  );
}
