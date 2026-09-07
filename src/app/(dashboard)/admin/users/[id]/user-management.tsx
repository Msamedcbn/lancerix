"use client";

import { useActionState, useState } from "react";

import {
  changeUserRole,
  deleteUserAccount,
  suspendUser,
  unsuspendUser,
  updateUserProfile,
  type FormState,
} from "@/app/(dashboard)/admin/actions";
import { FormFeedback, SubmitButton } from "@/components/form-feedback";
import { ROLE_LABEL } from "@/lib/labels";

const INITIAL: FormState = { error: null };

/** Edit the display name only -- email/TCKN/IBAN stay user-editable, see actions.ts. */
export function ProfileEditForm({
  profileId,
  fullName,
}: Readonly<{ profileId: string; fullName: string }>) {
  const [state, action] = useActionState(updateUserProfile, INITIAL);
  const [value, setValue] = useState(fullName);

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="profileId" value={profileId} />
      <input
        name="fullName"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full max-w-xs rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
      />
      <SubmitButton className="shrink-0" pendingLabel="Kaydediliyor...">
        Kaydet
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}

/** Suspend gates only NEW contract creation -- see actions.ts's suspendUser comment. */
export function SuspensionControl({
  profileId,
  suspendedAt,
  suspensionReason,
}: Readonly<{
  profileId: string;
  suspendedAt: string | null;
  suspensionReason: string | null;
}>) {
  const [suspendState, suspendAction] = useActionState(suspendUser, INITIAL);
  const [unsuspendState, unsuspendAction] = useActionState(unsuspendUser, INITIAL);
  const [showForm, setShowForm] = useState(false);

  if (suspendedAt) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-rose-700 dark:text-rose-300">
          Askıya alındı: {suspendedAt.slice(0, 16).replace("T", " ")}
        </p>
        {suspensionReason ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Gerekçe: {suspensionReason}</p>
        ) : null}
        <form action={unsuspendAction}>
          <input type="hidden" name="profileId" value={profileId} />
          <SubmitButton className="self-start" pendingLabel="Kaldırılıyor...">
            Askıyı Kaldır
          </SubmitButton>
        </form>
        <FormFeedback state={unsuspendState} />
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="self-start rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300"
      >
        Askıya Al
      </button>
    );
  }

  return (
    <form action={suspendAction} className="flex flex-col gap-2">
      <input type="hidden" name="profileId" value={profileId} />
      <textarea
        name="reason"
        required
        rows={2}
        placeholder="Askıya alma gerekçesi..."
        className="w-full max-w-md rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 text-sm text-zinc-950 shadow-xs focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <FormFeedback state={suspendState} />
      <div className="flex items-center gap-2">
        <SubmitButton tone="danger" pendingLabel="Askıya alınıyor...">
          Askıya Al
        </SubmitButton>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}

/** guard_profile_role() already secures this at the DB level -- see actions.ts. */
export function RoleChangeForm({
  profileId,
  currentRole,
}: Readonly<{ profileId: string; currentRole: string }>) {
  const [state, action] = useActionState(changeUserRole, INITIAL);
  const [selected, setSelected] = useState(currentRole);
  const [confirmAdmin, setConfirmAdmin] = useState("");

  const needsAdminConfirm = selected === "ADMIN" && selected !== currentRole;

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="profileId" value={profileId} />
      {needsAdminConfirm ? (
        <input type="hidden" name="confirmAdmin" value={confirmAdmin === "ADMIN" ? "yes" : ""} />
      ) : null}

      <select
        name="role"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <option value="FREELANCER">{ROLE_LABEL.FREELANCER}</option>
        <option value="CLIENT">{ROLE_LABEL.CLIENT}</option>
        <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>
      </select>

      {needsAdminConfirm ? (
        <div className="flex flex-col gap-1.5 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            ADMIN, tüm sistem üzerinde tam yetki demektir. Onaylamak için kutuya
            <strong> ADMIN</strong> yaz.
          </p>
          <input
            value={confirmAdmin}
            onChange={(e) => setConfirmAdmin(e.target.value)}
            placeholder="ADMIN"
            className="w-32 rounded-lg border border-amber-300 px-2 py-1 text-sm dark:border-amber-800 dark:bg-zinc-900"
          />
        </div>
      ) : null}

      <SubmitButton
        disabled={selected === currentRole || (needsAdminConfirm && confirmAdmin !== "ADMIN")}
        pendingLabel="Güncelleniyor..."
      >
        Rolü Güncelle
      </SubmitButton>
      <FormFeedback state={state} />
    </form>
  );
}

/**
 * Real deletion. Only ever succeeds for a genuinely empty account -- see
 * deleteUserAccount()'s comment on why the DB's own RESTRICT constraints are
 * the actual safety net here, not this form.
 */
export function DeleteAccountForm({
  profileId,
  publicId,
}: Readonly<{ profileId: string; publicId: string }>) {
  const [state, action] = useActionState(deleteUserAccount, INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="self-start rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
      >
        Hesabı Sil
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2 rounded-xl border border-rose-300 bg-rose-50/60 p-4 dark:border-rose-900 dark:bg-rose-950/30">
      <input type="hidden" name="profileId" value={profileId} />
      <p className="text-xs leading-relaxed text-rose-800 dark:text-rose-300">
        Bu geri alınamaz. Sözleşme geçmişi olan bir hesap zaten veritabanı
        tarafından reddedilir (RESTRICT) -- ancak gerçekten boş bir hesapsa
        kalıcı olarak silinir. Onaylamak için Lancerix ID&apos;yi
        (<strong>{publicId}</strong>) aşağıya yaz.
      </p>
      <input
        name="confirmText"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={publicId}
        className="w-40 rounded-lg border border-rose-300 px-2.5 py-1.5 text-sm font-mono dark:border-rose-800 dark:bg-zinc-900"
      />
      <FormFeedback state={state} />
      <div className="flex items-center gap-2">
        <SubmitButton tone="danger" disabled={confirmText !== publicId} pendingLabel="Siliniyor...">
          Kalıcı Olarak Sil
        </SubmitButton>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
