import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ClientDecision,
  DeliveryForm,
  TierPicker,
} from "@/app/(dashboard)/contracts/[id]/delivery-panel";
import { MilestoneActions } from "@/app/(dashboard)/contracts/[id]/milestone-actions";
import { SignContract } from "@/app/(dashboard)/contracts/[id]/signing";
import {
  ContractActions,
  ResubmitContract,
  StartDateConfirm,
} from "@/app/(dashboard)/contracts/[id]/contract-lifecycle";
import { Money } from "@/components/money";
import { PageHeading, Panel } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { WorkflowDiagram } from "@/components/workflow-diagram";
import { requireSession } from "@/lib/auth/session";
import {
  getContract,
  kurus,
  type AcceptanceCriterion,
  type Milestone,
} from "@/lib/data/contracts";
import {
  listActiveReviewers,
  listDeliveries,
  listDeliveryEvents,
  type DeliveryEvent,
  type DeliveryRow,
  type QaReport,
  type QaReviewer,
} from "@/lib/data/deliveries";
import { deliveryStatusLabel } from "@/lib/qa/delivery-state-machine";
import type { Enums } from "@/lib/supabase/database.types";

type EscrowStatus = Enums<"escrow_status">;
type Side = "freelancer" | "client";

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
}: Readonly<{ milestone: Milestone; side: Side }>) {
  return (
    <Panel>
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

/* ─────────── Free-text Criteria Panel ─────────── */
function CriteriaPanel({
  criteria,
}: Readonly<{ criteria: AcceptanceCriterion[] }>) {
  return (
    <Panel title="Kabul Kriterleri">
      {criteria.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Kriter eklenmemiş.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {criteria.map((c) => (
            <li
              key={c.id}
              className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800/60 dark:bg-zinc-900/40"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-extrabold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                {c.sequence_no}
              </span>
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {c.description}
              </p>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-5 border-t border-zinc-200 pt-3 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Teslim edildiğinde her kriter bu listeye göre doğrulanır.
      </p>
    </Panel>
  );
}

/** Days left before silence becomes acceptance. */
function ReviewCountdown({ deadline }: Readonly<{ deadline: string }>) {
  const days = Math.ceil((Date.parse(deadline) - Date.now()) / 86_400_000);
  const date = deadline.slice(0, 10);

  return (
    <p
      className={`text-sm ${
        days <= 2
          ? "font-medium text-rose-600 dark:text-rose-400"
          : "text-amber-700 dark:text-amber-400"
      }`}
    >
      {days > 0
        ? `İtiraz edilmezse ${days} gün içinde, ${date} tarihinde kabul edilmiş sayılacak.`
        : `Kontrol süresi ${date} tarihinde doldu. Kabul, bir sonraki taramada işlenecek.`}
    </p>
  );
}

function DeliveryPanel({
  contractId,
  side,
  deliveries,
  events,
  reviewers,
  signedByBoth,
}: Readonly<{
  contractId: string;
  side: Side;
  deliveries: DeliveryRow[];
  events: DeliveryEvent[];
  reviewers: QaReviewer[];
  signedByBoth: boolean;
}>) {
  const latest = deliveries[0];
  const isFreelancer = side === "freelancer";

  if (!signedByBoth) {
    return (
      <Panel title="Teslim">
        <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          İki taraf da imzalamadan teslim alınamaz. Sözleşme yürürlüğe
          girdiğinde bu bölüm açılır.
        </p>
      </Panel>
    );
  }

  if (!latest || latest.status === "REJECTED") {
    return (
      <Panel title={latest ? "Yeniden teslim" : "Teslim"}>
        {latest?.status === "REJECTED" ? (
          <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-relaxed text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            Önceki teslime itiraz edildi
            {latest.client_note ? `: ${latest.client_note}` : "."}
          </p>
        ) : null}

        {isFreelancer ? (
          <DeliveryForm contractId={contractId} />
        ) : (
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {latest
              ? "İtirazın karşı tarafa iletildi. Düzeltilmiş teslim geldiğinde kontrol süren yeniden başlar."
              : "Henüz bir teslim yapılmadı. Teslim geldiğinde kontrol süren burada başlar."}
          </p>
        )}
      </Panel>
    );
  }

  const order = latest.orders[0];
  const report = latest.reports[0];
  const myEvents = events.filter((e) => e.delivery_id === latest.id);

  return (
    <Panel title="Teslim">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <a
            href={latest.staging_url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-brand text-sm font-medium break-all hover:underline"
          >
            {latest.staging_url}
          </a>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            {deliveryStatusLabel(latest.status)}
          </span>
        </div>

        {latest.pr_url ? (
          <a
            href={latest.pr_url}
            target="_blank"
            rel="noreferrer noopener"
            className="-mt-3 text-xs break-all text-zinc-500 hover:underline dark:text-zinc-400"
          >
            {latest.pr_url}
          </a>
        ) : null}

        {latest.notes ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
            {latest.notes}
          </p>
        ) : null}

        {report ? <QaReportSummary report={report} /> : null}

        {latest.status === "AWAITING_CLIENT" && latest.client_review_deadline ? (
          <ReviewCountdown deadline={latest.client_review_deadline} />
        ) : null}

        {latest.status === "SUBMITTED" && isFreelancer ? (
          <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <TierPicker
              contractId={contractId}
              deliveryId={latest.id}
              reviewers={reviewers}
            />
          </div>
        ) : null}

        {latest.status === "SUBMITTED" && !isFreelancer ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Teslim alındı. Doğrulama paketi seçilince kontrol süren başlayacak.
          </p>
        ) : null}

        {latest.status === "QA_QUEUED" ? (
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {order?.tier === "TIER3"
              ? "QA masasına iletildi. Mühendis raporu yazdığında kontrol süresi başlayacak."
              : "QA kuyruğunda."}
          </p>
        ) : null}

        {latest.status === "AWAITING_CLIENT" && !isFreelancer ? (
          <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <ClientDecision contractId={contractId} deliveryId={latest.id} />
          </div>
        ) : null}

        {latest.status === "ACCEPTED" ? (
          <p className="text-brand text-sm">
            Kabul edildi{latest.decided_at ? ` · ${latest.decided_at.slice(0, 10)}` : ""}.
            {latest.client_note ? ` ${latest.client_note}` : ""}
          </p>
        ) : null}

        {myEvents.length > 0 ? (
          <ol className="flex flex-col gap-1 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            {myEvents.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline gap-x-2 text-xs text-zinc-500 dark:text-zinc-400"
              >
                <span className="tnum">{e.created_at.slice(0, 16).replace("T", " ")}</span>
                <span>{deliveryStatusLabel(e.to_status)}</span>
                <span className="text-zinc-400 dark:text-zinc-600">
                  {e.actor_kind === "SYSTEM" ? "otomatik" : null}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </Panel>
  );
}

function QaReportSummary({ report }: Readonly<{ report: QaReport }>) {
  const tone =
    report.status === "PASS"
      ? "text-brand"
      : report.status === "FAIL"
        ? "text-rose-600 dark:text-rose-400"
        : "text-amber-700 dark:text-amber-400";

  const label =
    report.status === "PASS"
      ? "Kriterler karşılandı"
      : report.status === "FAIL"
        ? "Kriterler karşılanmadı"
        : "Kısmen karşılandı";

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className={`text-sm font-medium ${tone}`}>{label}</p>
      <p className="tnum mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {report.generated_at.slice(0, 16).replace("T", " ")} · doğrulama raporu
      </p>
      <p className="mt-2 font-mono text-[0.7rem] break-all text-zinc-400">
        {report.document_sha256}
      </p>
    </div>
  );
}

/* ─────────── Contract Status Badge ─────────── */
function ContractStatusBadge({ status }: Readonly<{ status: string }>) {
  const config: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Taslak", color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
    PENDING_SIGNATURES: { label: "İmza Bekliyor", color: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60" },
    PENDING_REVIEW: { label: "İnceleme Bekliyor", color: "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60" },
    REVISION_REQUESTED: { label: "Revizyon İstendi", color: "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60" },
    REJECTED: { label: "Reddedildi", color: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60" },
    ACTIVE: { label: "Aktif", color: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60" },
    TERMINATED: { label: "Sonlandırıldı", color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500" },
    FULFILLED: { label: "Tamamlandı", color: "bg-brand/10 text-brand" },
  };

  const c = config[status] ?? { label: status, color: "bg-zinc-100 text-zinc-600" };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.color}`}>
      {c.label}
    </span>
  );
}

export default async function ContractPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invite?: string; reason?: string }>;
}>) {
  const { id } = await params;
  const session = await requireSession();
  const contract = await getContract(id, session.userId);

  if (!contract) notFound();

  const side: Side =
    contract.freelancer_id === session.userId ? "freelancer" : "client";

  const isQaOnly = contract.product_type === "QA_ONLY";
  const signedByBoth = contract.status === "ACTIVE";

  const deliveries = isQaOnly ? await listDeliveries(contract.id) : [];
  const [events, reviewers] = isQaOnly
    ? await Promise.all([
        listDeliveryEvents(deliveries.map((d) => d.id)),
        deliveries[0]?.status === "SUBMITTED" && side === "freelancer"
          ? listActiveReviewers()
          : Promise.resolve([]),
      ])
    : [[], []];

  // Contract lifecycle: can the client reject/revise?
  const canClientAct =
    side === "client" &&
    ["DRAFT", "PENDING_SIGNATURES", "PENDING_REVIEW"].includes(contract.status);

  // Start date confirmation
  const hasStartDate = Boolean(contract.planned_start_date);
  const myStartConfirmed =
    side === "freelancer"
      ? contract.freelancer_start_confirmed
      : contract.client_start_confirmed;
  const bothConfirmedStart =
    contract.freelancer_start_confirmed && contract.client_start_confirmed;

  return (
    <>
      <PageHeading
        title={contract.title}
        subtitle={
          <span className="flex items-center gap-1.5">
            {contract.reference} &middot;{" "}
            {contract.counterpartyPublicId ? (
              <Link
                href={`/profile/${contract.counterpartyPublicId}`}
                className="hover:text-brand hover:underline transition-colors"
              >
                {contract.counterpartyName}
              </Link>
            ) : (
              contract.counterpartyName
            )}{" "}
            ile
          </span>
        }
        action={
          <div className="flex items-center gap-3">
            <ContractStatusBadge status={contract.status} />
            <Link
              href={`/contracts/${contract.id}/record`}
              className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-50 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              Kaydı gör
            </Link>
          </div>
        }
      />

      {/* Rejection / Revision notice */}
      {contract.status === "REJECTED" && contract.rejection_reason && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900 dark:bg-rose-950/40">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
            ❌ Sözleşme Reddedildi
          </p>
          <p className="mt-2 text-sm leading-relaxed text-rose-600 dark:text-rose-400">
            {contract.rejection_reason}
          </p>
        </div>
      )}

      {contract.status === "REVISION_REQUESTED" && contract.revision_note && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900 dark:bg-orange-950/40">
          <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">
            ✏️ Revizyon Talep Edildi
          </p>
          <p className="mt-2 text-sm leading-relaxed text-orange-600 dark:text-orange-400">
            {contract.revision_note}
          </p>
          {side === "freelancer" && (
            <div className="mt-4 border-t border-dashed border-orange-200 pt-4 dark:border-orange-900/60">
              <ResubmitContract contractId={contract.id} />
            </div>
          )}
        </div>
      )}

      {/* Start Date Confirmation Card */}
      {signedByBoth && hasStartDate && !bothConfirmedStart && (
        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/40 p-6 shadow-sm dark:border-indigo-800/60 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                📅 İş Başlangıcı Onayı
              </h3>
              <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">
                Planlanan başlangıç:{" "}
                <strong>{contract.planned_start_date}</strong>
              </p>
              <p className="mt-1 text-xs text-indigo-600/80 dark:text-indigo-400/80">
                İki taraf da tarihi onayladığında iş resmi olarak başlar ve platform hizmet faturası oluşturulur.
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className={contract.freelancer_start_confirmed ? "text-emerald-600" : "text-zinc-400"}>
                  {contract.freelancer_start_confirmed ? "✓" : "○"} Freelancer
                </span>
                <span className={contract.client_start_confirmed ? "text-emerald-600" : "text-zinc-400"}>
                  {contract.client_start_confirmed ? "✓" : "○"} Müşteri
                </span>
              </div>
            </div>

            {!myStartConfirmed && (
              <StartDateConfirm contractId={contract.id} />
            )}
          </div>
        </div>
      )}

      {/* Work started badge */}
      {contract.work_started_at && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/30">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            ✅ İş Başladı — {contract.work_started_at.slice(0, 10)}
          </p>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col gap-6">
          <Panel title="Şartlar">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-600 dark:text-zinc-300">
              {contract.scope_of_work}
            </p>

            {contract.product_type === "QA_ONLY" ? (
              <p className="mt-5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                QA testi sözleşmesi. Escrow ve fatura bu sözleşmeye dahil
                değil — ödeme taraflar arasında doğrudan çözülür.
              </p>
            ) : (
              <>
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
              </>
            )}
          </Panel>

          <Panel title="İmzalar">
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

          {/* Client reject/revise actions */}
          {canClientAct && (
            <Panel title="Sözleşme İşlemleri">
              <ContractActions contractId={contract.id} />
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <WorkflowDiagram 
            contract={contract} 
            productType={contract.product_type} 
            criteriaCount={contract.criteria.length} 
            side={side}
          />

          {isQaOnly ? (
            <>
              <DeliveryPanel
                contractId={contract.id}
                side={side}
                deliveries={deliveries}
                events={events}
                reviewers={reviewers}
                signedByBoth={signedByBoth}
              />
              <CriteriaPanel criteria={contract.criteria} />
            </>
          ) : (
            contract.milestones.map((m) => (
              <MilestoneCard key={m.id} milestone={m} side={side} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
