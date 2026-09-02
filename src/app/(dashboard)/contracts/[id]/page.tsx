import Link from "next/link";
import { notFound } from "next/navigation";

import { CriteriaPanel } from "@/app/(dashboard)/contracts/[id]/criteria-panel";
import {
  ClientDecision,
  DeliveryForm,
  QaOrderPayment,
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
import { MessageThread } from "@/app/(dashboard)/contracts/[id]/message-thread";
import { WorkflowDiagram } from "@/components/workflow-diagram";
import {
  PROJECT_CATEGORY_INFO,
  type ProjectCategory,
} from "@/lib/validations/project-category";
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
import { listMessages } from "@/lib/data/messages";
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
      <dt className="text-xs text-muted-foreground dark:text-muted-foreground">{label}</dt>
      <dd
        className={`mt-0.5 text-sm ${
          strong
            ? "text-brand font-medium"
            : "text-foreground dark:text-foreground"
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
            <p className="text-sm font-medium text-foreground dark:text-foreground">
              {milestone.sequence_no}. {milestone.title}
            </p>
            {milestone.due_date ? (
              <p className="mt-0.5 text-xs text-muted-foreground dark:text-muted-foreground">
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
  projectCategory,
  side,
  deliveries,
  events,
  reviewers,
  signedByBoth,
}: Readonly<{
  contractId: string;
  projectCategory: ProjectCategory;
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
        <p className="text-sm leading-relaxed text-muted-foreground dark:text-muted-foreground">
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
          <DeliveryForm
            contractId={contractId}
            projectCategory={projectCategory}
          />
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground dark:text-muted-foreground">
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
          <span className="rounded-full bg-muted/80 px-2.5 py-1 text-xs text-foreground/80 dark:bg-muted/80 dark:text-muted-foreground">
            {deliveryStatusLabel(latest.status)}
          </span>
        </div>

        {latest.pr_url ? (
          <a
            href={latest.pr_url}
            target="_blank"
            rel="noreferrer noopener"
            className="-mt-3 text-xs break-all text-muted-foreground hover:underline dark:text-muted-foreground"
          >
            {latest.pr_url}
          </a>
        ) : null}

        {latest.notes ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80 dark:text-muted-foreground">
            {latest.notes}
          </p>
        ) : null}

        {report ? <QaReportSummary report={report} /> : null}

        {latest.status === "AWAITING_CLIENT" && latest.client_review_deadline ? (
          <ReviewCountdown deadline={latest.client_review_deadline} />
        ) : null}

        {latest.status === "SUBMITTED" && isFreelancer ? (
          <div className="border-t border-border pt-5 dark:border-border/50">
            <TierPicker
              contractId={contractId}
              deliveryId={latest.id}
              reviewers={reviewers}
            />
          </div>
        ) : null}

        {latest.status === "SUBMITTED" && !isFreelancer ? (
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Teslim alındı. Doğrulama paketi seçilince kontrol süren başlayacak.
          </p>
        ) : null}

        {latest.status === "QA_QUEUED" ? (
          <p className="text-sm leading-relaxed text-muted-foreground dark:text-muted-foreground">
            {order?.tier === "TIER3"
              ? "QA masasına iletildi. Mühendis raporu yazdığında kontrol süresi başlayacak."
              : "QA kuyruğunda."}
          </p>
        ) : null}

        {order ? <QaOrderPayment order={order} /> : null}

        {latest.status === "AWAITING_CLIENT" && !isFreelancer ? (
          <div className="border-t border-border pt-5 dark:border-border/50">
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
          <ol className="flex flex-col gap-1 border-t border-border pt-4 dark:border-border/50">
            {myEvents.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground dark:text-muted-foreground"
              >
                <span className="tnum">{e.created_at.slice(0, 16).replace("T", " ")}</span>
                <span>{deliveryStatusLabel(e.to_status)}</span>
                <span className="text-muted-foreground dark:text-foreground/80">
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
    <div className="rounded-xl border border-border p-4 dark:border-border/50">
      <p className={`text-sm font-medium ${tone}`}>{label}</p>
      <p className="tnum mt-1 text-xs text-muted-foreground dark:text-muted-foreground">
        {report.generated_at.slice(0, 16).replace("T", " ")} · doğrulama raporu
      </p>
      <p className="mt-2 font-mono text-[0.7rem] break-all text-muted-foreground">
        {report.document_sha256}
      </p>
    </div>
  );
}

/* ─────────── Contract Status Badge ─────────── */
function ContractStatusBadge({ status }: Readonly<{ status: string }>) {
  const config: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Taslak", color: "bg-muted/80 text-foreground/80 dark:bg-zinc-800 dark:text-muted-foreground" },
    PENDING_SIGNATURES: { label: "İmza Bekliyor", color: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60" },
    PENDING_REVIEW: { label: "İnceleme Bekliyor", color: "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60" },
    REVISION_REQUESTED: { label: "Revizyon İstendi", color: "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60" },
    REJECTED: { label: "Reddedildi", color: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60" },
    ACTIVE: { label: "Aktif", color: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60" },
    TERMINATED: { label: "Sonlandırıldı", color: "bg-muted/80 text-muted-foreground dark:bg-zinc-800 dark:text-muted-foreground" },
    FULFILLED: { label: "Tamamlandı", color: "bg-brand/10 text-brand" },
  };

  const c = config[status] ?? { label: status, color: "bg-muted/80 text-foreground/80" };

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

  const messages = await listMessages(contract.id, session.userId);

  const isParty = contract.freelancer_id === session.userId || contract.client_id === session.userId;

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
            <span className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/80 dark:border-border/50 dark:bg-muted/80 dark:text-muted-foreground">
              {PROJECT_CATEGORY_INFO[contract.project_category].label}
            </span>
            <ContractStatusBadge status={contract.status} />
            <Link
              href={`/contracts/${contract.id}/record`}
              className="inline-flex items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98] dark:border-border/50 dark:bg-muted dark:text-foreground dark:hover:bg-muted/80"
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
                <span className={contract.freelancer_start_confirmed ? "text-emerald-600" : "text-muted-foreground"}>
                  {contract.freelancer_start_confirmed ? "✓" : "○"} Freelancer
                </span>
                <span className={contract.client_start_confirmed ? "text-emerald-600" : "text-muted-foreground"}>
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
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80 dark:text-muted-foreground">
              {contract.scope_of_work}
            </p>

            {contract.product_type === "QA_ONLY" ? (
              <>
                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <dt className="text-xs text-muted-foreground dark:text-muted-foreground">
                      Proje Bedeli
                    </dt>
                    <dd className="tnum mt-0.5 text-sm font-bold text-foreground dark:text-foreground">
                      <Money kurus={contract.project_amount_kurus} />
                    </dd>
                  </div>
                </dl>
                <p className="mt-5 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                  Ödeme taraflar arasında doğrudan çözülür. Lancerix bu tutar
                  üzerinden bir komisyon almaz — gelir yalnızca QA test
                  hizmetinden elde edilir.
                </p>
              </>
            ) : (
              <>
                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <dt className="text-xs text-muted-foreground dark:text-muted-foreground">
                      Hizmet bedeli
                    </dt>
                    <dd className="tnum mt-0.5 text-sm text-foreground dark:text-foreground">
                      %{contract.platform_fee_bps / 100}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground dark:text-muted-foreground">
                      Stopaj
                    </dt>
                    <dd className="tnum mt-0.5 text-sm text-foreground dark:text-foreground">
                      %{contract.stopaj_bps / 100}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground dark:text-muted-foreground">
                      İtiraz süresi
                    </dt>
                    <dd className="tnum mt-0.5 text-sm text-foreground dark:text-foreground">
                      {contract.objection_window_days} gün
                    </dd>
                  </div>
                </dl>

                {contract.company ? (
                  <p className="mt-5 text-xs leading-relaxed text-muted-foreground dark:text-muted-foreground">
                    {contract.company.legal_name} adına fatura edilir (VKN{" "}
                    {contract.company.vkn}), {contract.company.tax_office}.
                  </p>
                ) : null}
              </>
            )}
          </Panel>

          {isParty && (
            <Panel title="İmzalar">
              <SignContract
                contractId={contract.id}
                alreadySigned={contract.signatures.some(
                  (s) => s.signer_id === session.userId,
                )}
                otherPartySigned={contract.signatures.some(
                  (s) => s.signer_id !== session.userId,
                )}
                criteriaMissing={
                  contract.product_type === "QA_ONLY" && contract.criteria.length === 0
                }
              />
            </Panel>
          )}

          {/* Client reject/revise actions */}
          {isParty && canClientAct && (
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
            messages={messages}
          />

          {isQaOnly ? (
            <>
              <DeliveryPanel
                contractId={contract.id}
                projectCategory={contract.project_category}
                side={side}
                deliveries={deliveries}
                events={events}
                reviewers={reviewers}
                signedByBoth={signedByBoth}
              />
              <CriteriaPanel
                contractId={contract.id}
                criteria={contract.criteria}
                side={side}
                projectCategory={contract.project_category}
                anySigned={contract.signatures.length > 0}
              />
            </>
          ) : (
            contract.milestones.map((m) => (
              <MilestoneCard key={m.id} milestone={m} side={side} />
            ))
          )}

          {/* Phase-scoped notes live on their phase in the flowchart, so the
              general thread shows only what was said about the contract as a
              whole -- otherwise every phase note would appear twice. */}
          <Panel title="Mesajlar">
            <MessageThread
              contractId={contract.id}
              messages={messages.filter((m) => !m.phase_id)}
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
