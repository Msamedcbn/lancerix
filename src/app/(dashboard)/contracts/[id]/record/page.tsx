import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ShieldCheck, CheckCircle2, AlertTriangle, FileCode, Clock, ExternalLink } from "lucide-react";

import { PageHeading, Panel } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireSession } from "@/lib/auth/session";
import { hashDocument, renderContractDocument } from "@/lib/contracts/document";
import { getContract } from "@/lib/data/contracts";
import { listDeliveries, listDeliveryEvents } from "@/lib/data/deliveries";
import { deliveryStatusLabel } from "@/lib/qa/delivery-state-machine";
import { probeDeliveryTarget, type DeliveryProbeResult } from "@/lib/qa/delivery-prober";
import { createClient } from "@/lib/supabase/server";

const when = (value: string) => value.slice(0, 16).replace("T", " ");

const PARTY: Record<string, string> = {
  FREELANCER: "Hizmeti veren (Yazılımcı)",
  CLIENT: "Hizmeti alan (İşveren)",
  PLATFORM: "Lancerix Hakemlik Protokolü",
};

const ACTOR: Record<string, string> = {
  USER: "Taraf",
  ADMIN: "Teknik Bilirkişi / Yönetici",
  SYSTEM: "Otonom Zaman Damgası / Protokol",
};

/**
 * The complete cryptographic and technical history of a contract:
 * 1. The exact signed terms, bilateral signatures and SHA-256 seals.
 * 2. The defined Acceptance Criteria (Specification as Code).
 * 3. The Proof of Delivery (PoD): staging URLs, test execution, security scans.
 * 4. The Objection Window & auto-acceptance clock history.
 * 5. The immutable event ledger.
 *
 * This artifact serves as a binding Technical Arbitration & Expert Evidence Record
 * under Turkish Code of Obligations (TBK art. 473-477) and E-Signature Law No. 5070.
 */
export default async function ContractRecordPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const session = await requireSession();
  const contract = await getContract(id, session.userId);

  if (!contract) notFound();

  const document = renderContractDocument(
    contract,
    contract.milestones,
    {
      freelancerName:
        contract.freelancer_id === session.userId
          ? session.fullName
          : contract.counterpartyName,
      clientName:
        contract.client_id === session.userId
          ? session.fullName
          : contract.counterpartyName,
      company: contract.company,
    },
    contract.criteria,
  );
  const currentHash = hashDocument(document);

  const supabase = await createClient();
  const [deliveries, { data: ledger }] = await Promise.all([
    listDeliveries(contract.id),
    supabase
      .from("escrow_transactions")
      .select("*, milestone:milestones(title, sequence_no)")
      .in(
        "milestone_id",
        contract.milestones.map((m) => m.id),
      )
      .order("created_at", { ascending: true }),
  ]);

  const deliveryEvents = await listDeliveryEvents(deliveries.map((d) => d.id));
  const latestDelivery = deliveries[0];
  const liveProbe: DeliveryProbeResult | null = latestDelivery
    ? await probeDeliveryTarget(latestDelivery.staging_url)
    : null;

  return (
    <>
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldCheck className="size-3.5" />
          Kriptografik Zaman Damgalı Resmi Bilirkişi & Teslimat Kaydı
        </div>
        <PageHeading
          title="Teknik Hakemlik ve Teslimat Raporu"
          subtitle={`${contract.reference} · ${contract.title}`}
          action={
            <div className="flex items-center gap-2">
              <Link
                href={`/contracts/${contract.id}`}
                className="inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted active:scale-[0.98]"
              >
                Sözleşmeye dön
              </Link>
              <a
                href={`/api/contracts/${contract.id}/pdf?type=dossier`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]"
              >
                <Download className="size-3.5" aria-hidden />
                Resmi PDF Raporu
              </a>
            </div>
          }
        />
      </div>

      {/* Hukuki ve Teknik Hakemlik Beyanı */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground sm:p-5">
        <p className="font-semibold text-foreground flex items-center gap-1.5 mb-1 text-sm">
          <span>⚖️</span> Hukuki Nitelik & Delil Sözleşmesi Beyanı (TBK m. 473-477 / HMK m. 193)
        </p>
        <p>
          İşbu rapor; tarafların serbest iradesiyle imzaladığı teknik şartnameyi, belirlenen somut kabul kriterlerini,
          teslim anındaki çalışma ve güvenlik denetim kayıtlarını (Proof of Delivery) ve kanuni itiraz penceresi sürecini
          belgeleyen resmi teknik delil kaydıdır. Sübjektif (&ldquo;beğenmedim&rdquo;) ret beyanlarının aksine, tarafların somut teknik
          ayıp bildirimleri ve sistemin otonom denetimleri mahkeme, arabuluculuk ve icra mercilerinde bağlayıcı delil teşkil eder.
        </p>
      </div>

      {/* Kriptografik Teslimat Kanıtı (Proof of Delivery) */}
      <Panel title="Kriptografik Teslimat Kanıtı (Proof of Delivery)">
        {deliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Bu sözleşme için henüz bir teslimat sunulmadı.
          </p>
        ) : (
          <div className="space-y-6">
            {deliveries.map((delivery, idx) => {
              const report = delivery.reports[0];
              const relevantEvents = deliveryEvents.filter((e) => e.delivery_id === delivery.id);

              return (
                <div
                  key={delivery.id}
                  className="rounded-xl border border-border bg-card/50 p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Teslim #{deliveries.length - idx}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="tnum text-xs text-muted-foreground">
                        {when(delivery.submitted_at)}
                      </span>
                    </div>
                    <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                      {deliveryStatusLabel(delivery.status)}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Canlı Test / Staging Adresi:</p>
                      <a
                        href={delivery.staging_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-primary flex items-center gap-1 hover:underline break-all"
                      >
                        {delivery.staging_url}
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </div>
                    {delivery.pr_url && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Kaynak Kod / PR Deposu:</p>
                        <a
                          href={delivery.pr_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline break-all"
                        >
                          {delivery.pr_url}
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      </div>
                    )}
                  </div>

                  {delivery.notes && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Teslim Notu:</p>
                      <p className="text-xs text-foreground bg-muted/40 rounded-lg p-2.5">
                        {delivery.notes}
                      </p>
                    </div>
                  )}

                  {/* Canlı Nöbetçi Prober / Çalışma Kanıtı */}
                  {idx === 0 && liveProbe && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                          </span>
                          Canlı Çalışma ve Erişilebilirlik Nöbetçisi (ProofGuard Prober):
                        </div>
                        <span className="font-mono text-[0.7rem] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                          {liveProbe.healthy ? `HTTP ${liveProbe.statusCode} OK · ${liveProbe.latencyMs}ms` : "ERİŞİM HATASI"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[0.75rem] pt-1">
                        <div>
                          <span className="text-muted-foreground block text-[0.68rem]">Durum:</span>
                          <span className="font-medium text-foreground">{liveProbe.healthy ? "Aktif & Yayında" : "Ulaşılamadı"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[0.68rem]">Yanıt Gecikmesi:</span>
                          <span className="font-medium text-foreground">{liveProbe.latencyMs} ms</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[0.68rem]">Bağlantı Güvenliği:</span>
                          <span className="font-medium text-foreground">{liveProbe.isHttps ? "TLS / HTTPS" : "HTTP"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[0.68rem]">Son Kanıt Zamanı:</span>
                          <span className="font-medium text-foreground">Anlık Doğrulandı</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* İtiraz Penceresi & Karar Durumu */}
                  <div className="rounded-lg border border-border/80 bg-muted/20 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Clock className="size-3.5 text-muted-foreground" />
                        İtiraz & İnceleme Sayacı:
                      </span>
                      <span className="text-muted-foreground">
                        {delivery.client_review_deadline
                          ? `Son İtiraz Tarihi: ${when(delivery.client_review_deadline)}`
                          : "Süre tamamlandı"}
                      </span>
                    </div>

                    {delivery.client_note && (
                      <div className="mt-2 pt-2 border-t border-border/60">
                        <p className="font-semibold text-rose-600 dark:text-rose-400 mb-1">
                          İşveren İtiraz Gerekçesi (Resmi Kayıt):
                        </p>
                        <p className="whitespace-pre-wrap font-mono text-[0.8rem] bg-rose-500/10 text-rose-900 dark:text-rose-200 p-2 rounded">
                          {delivery.client_note}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* QA & Güvenlik Denetim Sonuçları */}
                  {report && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <ShieldCheck className="size-4 text-primary" />
                          Otonom QA ve Güvenlik Denetimi:
                        </span>
                        <span className={`font-bold px-2 py-0.5 rounded text-[0.7rem] ${
                          report.status === "PASS"
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                        }`}>
                          {report.status === "PASS" ? "ONAYLANDI (PASS)" : "KUSURLU (FAIL)"}
                        </span>
                      </div>
                      <p className="font-mono text-[0.7rem] text-muted-foreground break-all">
                        Rapor SHA-256: {report.document_sha256}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Teknik Kabul Kriterleri Matrisi */}
      <Panel title="Teknik Kabul Kriterleri Matrisi (Şartname)">
        {contract.criteria.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Özel kabul kriteri tanımlanmamış; standart sözleşme kapsamı geçerlidir.
          </p>
        ) : (
          <div className="space-y-3">
            {contract.criteria.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-xs"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {c.sequence_no}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium text-foreground">{c.description}</p>
                  <p className="text-[0.7rem] text-muted-foreground font-mono">
                    Kontrol tipi: {c.check_type || "MANUAL_VERIFICATION"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel
          title="İmzalanan Metin"
          action={
            <a
              href={`/api/contracts/${contract.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted active:scale-[0.98]"
            >
              <Download className="size-3.5" aria-hidden />
              PDF indir
            </a>
          }
        >
          <iframe
            src={`/api/contracts/${contract.id}/pdf`}
            title="Sözleşme PDF"
            className="h-[32rem] w-full rounded-xl border border-border bg-muted/20"
          />
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
              Ham metni göster (imza doğrulaması için)
            </summary>
            <pre className="mt-2 max-h-[24rem] overflow-auto rounded-xl bg-muted/40 p-4 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
              {document}
            </pre>
          </details>
          <p className="tnum mt-3 font-mono text-[0.7rem] break-all text-muted-foreground">
            sha256: {currentHash}
          </p>
        </Panel>

        <Panel title="Elektronik İmzalar & Zaman Damgası">
          {contract.signatures.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz imzalanmadı.
            </p>
          ) : (
            <ul className="flex flex-col gap-5">
              {contract.signatures.map((s) => {
                const matches = s.document_sha256 === currentHash;

                return (
                  <li key={s.id} className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">
                      {PARTY[s.party] ?? s.party}
                    </p>
                    <p className="tnum text-xs text-muted-foreground">
                      {when(s.signed_at)} · {String(s.ip_address)}
                    </p>
                    <p className="font-mono text-[0.7rem] break-all text-muted-foreground">
                      {s.document_sha256}
                    </p>
                    <p
                      className={`text-xs ${
                        matches
                          ? "text-primary font-medium"
                          : "font-semibold text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {matches
                        ? "✓ Metin özeti doğrulandı (Değiştirilmedi)."
                        : "✕ Metin özeti uyuşmuyor — imzadan sonra şartlar değişmiş."}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Değiştirilemez Olay ve Durum Kütüğü (Audit Trail)">
        {!ledger || ledger.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz bir hareket olmadı.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Zaman
                  </th>
                  <th className="pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Aşama
                  </th>
                  <th className="pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Değişim
                  </th>
                  <th className="pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Kim
                  </th>
                  <th className="pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Gerekçe
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.map((row) => (
                  <tr key={row.id} className="fade-in align-top">
                    <td className="tnum py-3 pr-4 whitespace-nowrap text-muted-foreground">
                      {when(row.created_at)}
                    </td>
                    <td className="py-3 pr-4 text-foreground font-medium">
                      {row.milestone
                        ? `${row.milestone.sequence_no}. ${row.milestone.title}`
                        : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        {row.from_status ? (
                          <StatusBadge status={row.from_status} />
                        ) : (
                          <span className="text-xs text-muted-foreground">yeni</span>
                        )}
                        <span className="text-muted-foreground">→</span>
                        <StatusBadge status={row.to_status} />
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {ACTOR[row.actor_kind] ?? row.actor_kind}
                    </td>
                    <td className="max-w-[28ch] py-3 text-muted-foreground">
                      {row.reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
