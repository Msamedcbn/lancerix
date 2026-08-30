import type { ReactNode } from "react";

/**
 * Label above, input, helper below. The order is fixed because scanning a form
 * is a vertical act: a label to the side of its input makes the eye zigzag.
 *
 * Helper text lives in the markup whether or not it is filled, so adding one
 * later never shifts the layout under the reader.
 */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: Readonly<{
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-zinc-950 dark:text-zinc-50"
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p className="max-w-[58ch] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const base =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-950/5 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600";

export function TextInput(props: React.ComponentProps<"input">) {
  return <input {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.ComponentProps<"textarea">) {
  return <textarea {...props} className={`${base} ${props.className ?? ""}`} />;
}

export function Select(props: React.ComponentProps<"select">) {
  return <select {...props} className={`${base} ${props.className ?? ""}`} />;
}
