import Link from "next/link";
import { notFound } from "next/navigation";

import { MilestoneActions } from "@/app/(dashboard)/contracts/[id]/milestone-actions";
import { SignContract } from "@/app/(dashboard)/contracts/[id]/signing";
import { Money } from "@/components/money";
import { PageHeading, Panel } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireSession } from "@/lib/auth/session";
import { getContract, kurus, type Milestone } from "@/lib/data/contracts";
import type { Enums } from "@/lib/supabase/database.types";

type EscrowStatus = Enums<"escrow_status">;
type Side = "freelancer" | "client";

/**
 * Which moves each side may make, and what to call them.
 *
 * This mirrors can_actor_transition() in Postgres rather than deciding
 * anything: the database refuses an edge this list gets wrong, so the worst a
 * mismatch here can do is hide a button or show one that errors. Funding is
 * absent on purpose -- only a verified provider webhook may move a milestone
 * into IN_PROGRESS, never a button.
 */
function actionsFor(status: EscrowStatus, side: Side) {
  const moves: Array<{ to: EscrowStatus; label: string; tone?: "danger" }> = [];

  if (side === "freelancer" && status === "DRAFT") {
    moves.push({ to: "AWAITING_PAYMENT", label: "Fonlamaya aç" });
  }

  if (side === "client" && status === "SUBMITTED") {
    moves.push({ to: "COMPLETED", label: "Teslimatı onayla" });
    moves.push({ to: "IN_PROGRESS", label: "Revizyona gönder" });
  }

  if (status === "DRAFT" || status === "AWAITING_PAYMENT") {
    moves.push({ to: "CANCELLED", label: "İptal et", tone: "danger" });
  }

  return moves;
}

/** Funded work is the only work either party may escalate. */
const DISPUTABLE: readonly EscrowStatus[] = [
  "IN_PROGRESS",
  "SUBMITTED",
  "COMPLETED",
];

function Countdown({ deadline }: Readonly<{ deadline: string }>) {
  const days = Math.ceil((Date.parse(deadline) - Date.now()) / 86_400_000);
  const date = deadline.slice(0, 10);

  return (
    <p
      className={`text-sm font-medium ${
        days <= 2
          ? "text-rose-600 dark:text-rose-400"
          : "text-amber-700 dark:text-amber-400"
      }`}
    >
      {days > 0
        ? `İtiraz edilmezse ${days} gün içinde, ${date} tarihinde kabul edilmiş sayılacak.`
        : `İtiraz süresi ${date} tarihinde doldu. Kabul, bir sonraki taramada işlenecek.`}
    </p>
  );
}

function Amount({
  label,
  kurus: value,
  strong,
}: Readonly<{ label: string; kurus: number; strong?: boolean }>) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd
        className={`mt-0.5 text-sm ${
          strong
            ? "text-brand font-medium"
            : "text-zinc-950 dark:text-zinc-50"
        }`}
      >
        <Money kurus={value} />
      </dd>
    </div>
  );
}

function MilestoneCard({
  milestone,
  side,
  index,
}: Readonly<{ milestone: Milestone; side: Side; index: number }>) {
  return (
    <Panel index={index}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              {milestone.sequence_no}. {milestone.title}
            </p>
            {milestone.due_date ? (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Teslim tarihi {milestone.due_date}
              </p>
            ) : null}
          </div>
          <StatusBadge status={milestone.status} />
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-5">
          <Amount label="Sözleşme bedeli" kurus={milestone.gross_amount_kurus} />
          <Amount
            label="Hizmet bedeli"
            kurus={kurus(milestone.platform_fee_kurus, "platform_fee_kurus")}
          />
          <Amount
            label="Müşteri öder"
            kurus={kurus(milestone.client_charge_kurus, "client_charge_kurus")}
          />
          <Amount
            label="Stopaj"
            kurus={kurus(milestone.tax_withholding_kurus, "tax_withholding_kurus")}
          />
          <Amount
            label="Freelancer alır"
            kurus={kurus(milestone.freelancer_net_kurus, "freelancer_net_kurus")}
            strong
          />
        </dl>

        {milestone.status === "SUBMITTED" && milestone.auto_accept_at ? (
          <Countdown deadline={milestone.auto_accept_at} />
        ) : null}

        <MilestoneActions
          milestoneId={milestone.id}
          actions={actionsFor(milestone.status, side)}
          canDispute={DISPUTABLE.includes(milestone.status)}
          canDeliver={side === "freelancer" && milestone.status === "IN_PROGRESS"}
        />
      </div>
    </Panel>
  );
}

export default async function ContractPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const session = await requireSession();
  const contract = await getContract(id, session.userId);

  if (!contract) notFound();

  const side: Side =
    contract.freelancer_id === session.userId ? "freelancer" : "client";

  return (
    <>
      <PageHeading
        title={contract.title}
        subtitle={`${contract.reference} · ${contract.counterpartyName} ile`}
        action={
          <Link
            href={`/contracts/${contract.id}/record`}
            className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-50 active:translate-y-px dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Kaydı gör
          </Link>
        }
      />

      {/* Asymmetric: the terms are read once, the milestones are worked in, so
          the milestones get the wide column. */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col gap-6">
          <Panel title="Şartlar">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
              {contract.scope_of_work}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  Hizmet bedeli
                </dt>
                <dd className="tnum mt-0.5 text-sm text-zinc-950 dark:text-zinc-50">
                  %{contract.platform_fee_bps / 100}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  Stopaj
                </dt>
                <dd className="tnum mt-0.5 text-sm text-zinc-950 dark:text-zinc-50">
                  %{contract.stopaj_bps / 100}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  İtiraz süresi
                </dt>
                <dd className="tnum mt-0.5 text-sm text-zinc-950 dark:text-zinc-50">
                  {contract.objection_window_days} gün
                </dd>
              </div>
            </dl>

            {contract.company ? (
              <p className="mt-5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {contract.company.legal_name} adına fatura edilir (VKN{" "}
                {contract.company.vkn}), {contract.company.tax_office}.
              </p>
            ) : null}

            <p className="mt-3 border-t border-zinc-200 pt-3 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Bu oranlar ve süre sözleşme kurulduğu anda donduruldu. Sonradan
              yapılan bir değişiklik bu sözleşmeye ulaşmaz.
            </p>
          </Panel>

          <Panel title="İmzalar" index={1}>
            <SignContract
              contractId={contract.id}
              alreadySigned={contract.signatures.some(
                (s) => s.signer_id === session.userId,
              )}
              otherPartySigned={contract.signatures.some(
                (s) => s.signer_id !== session.userId,
              )}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          {contract.milestones.map((m, i) => (
            <MilestoneCard key={m.id} milestone={m} side={side} index={i} />
          ))}
        </div>
      </div>
    </>
  );
}
