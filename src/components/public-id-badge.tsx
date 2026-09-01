"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";

/**
 * Every user's identity in the system a counterparty actually has to type:
 * the 8-character public ID, shown wherever a user can see their own header.
 *
 * Contract creation looks a client up by this code (findCounterparty /
 * find_by_public_id) and nowhere else in the product showed it to the person
 * who owns it -- the whole lookup flow depended on a value nobody could find.
 * This is the one place guaranteed to render for every signed-in user, on
 * every page, in both roles.
 */
export function PublicIdBadge({ publicId }: Readonly<{ publicId: string }>) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied by the browser; the code is still
      // visible to select and copy by hand, so this fails quietly.
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 py-1 pr-1 pl-2 dark:border-zinc-800 dark:bg-zinc-900">
      <Link
        href={`/profile/${publicId}`}
        target="_blank"
        rel="noreferrer noopener"
        className="hover:text-brand font-mono text-xs font-medium tracking-wider text-zinc-600 dark:text-zinc-300"
        title="Herkese açık profilini gör"
      >
        {publicId}
      </Link>
      <button
        type="button"
        onClick={copy}
        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 active:scale-[0.92] dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        title="Lancerix ID'ni kopyala"
        aria-label="Lancerix ID'ni kopyala"
      >
        {copied ? (
          <Check className="text-brand size-4" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
    </div>
  );
}
