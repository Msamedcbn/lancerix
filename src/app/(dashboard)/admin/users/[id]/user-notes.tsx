"use client";

import { useActionState } from "react";

import { addUserNote, type FormState } from "@/app/(dashboard)/admin/actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import type { AdminUserNote } from "@/lib/data/admin-users";

const INITIAL: FormState = { error: null };

/** is_admin()-only end to end -- the profile owner never sees this panel or its data. */
export function UserNotes({
  profileId,
  notes,
}: Readonly<{ profileId: string; notes: AdminUserNote[] }>) {
  const [state, action] = useActionState(addUserNote, INITIAL);

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="profileId" value={profileId} />
        <textarea
          name="body"
          required
          rows={3}
          placeholder="Bu kullanıcı hakkında bir not yaz..."
          className="w-full rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm text-zinc-950 shadow-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <FormFeedback state={state} />
        <SubmitButton className="self-start" pendingLabel="Kaydediliyor...">
          Not Ekle
        </SubmitButton>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Henüz not yok.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {notes.map((n) => (
            <li key={n.id} className="py-2.5 first:pt-0 last:pb-0">
              <p className="text-sm whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                {n.body}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {n.author?.full_name ?? "Bilinmeyen"} · {n.created_at.slice(0, 16).replace("T", " ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
