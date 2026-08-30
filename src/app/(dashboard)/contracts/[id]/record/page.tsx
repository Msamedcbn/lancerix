import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading, Panel } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { requireSession } from "@/lib/auth/session";
import { hashDocument, renderContractDocument } from "@/lib/contracts/document";
import { getContract } from "@/lib/data/contracts";
import { createClient } from "@/lib/supabase/server";

const when = (value: string) => value.slice(0, 16).replace("T", " ");

const PARTY: Record<string, string> = {
  FREELANCER: "Hizmeti veren",
  CLIENT: "Hizmeti alan",
  PLATFORM: "Platform",
};

const ACTOR: Record<string, string> = {
  USER: "Taraf",
  ADMIN: "Yönetici",
  SYSTEM: "Otomatik",
};

/**
 * The whole history of one contract on a single page: the exact signed text,
 * who signed it and from where, every status change, and whether an acceptance
 * was given or reached by the window closing.
 *
 * This is the artifact the product produces. The point of the clock is not the
 * automation, it is that the automation leaves evidence.
 */
export default async function ContractRecordPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const session = await requireSession();
  const contract = await getContract(id, session.userId);

  if (!contract) notFound();

  const document = renderContractDocument(contract, contract.milestones, {
    freelancerName:
      contract.freelancer_id === session.userId
        ? session.fullName
        : contract.counterpartyName,
    clientName:
      contract.client_id === session.userId
        ? session.fullName
        : contract.counterpartyName,
    company: contract.company,
  });
  const currentHash = hashDocument(document);

  const supabase = await createClient();
  const { data: ledger } = await supabase
    .from("escrow_transactions")
    .select("*, milestone:milestones(title, sequence_no)")
    .in(
      "milestone_id",
      contract.milestones.map((m) => m.id),
    )
    .order("created_at", { ascending: true });

  return (
    <>
      <PageHeading
        title="Kayıt"
        subtitle={`${contract.reference} · ${contract.title}`}
        action={
          <Link
            href={`/contracts/${contract.id}`}
            className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-50 active:translate-y-px dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Sözleşmeye dön
          </Link>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="İmzalanan metin">
          <pre className="max-h-[32rem] overflow-auto rounded-xl bg-zinc-50 p-4 text-xs leading-relaxed whitespace-pre-wrap text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {document}
          </pre>
          <p className="tnum mt-3 font-mono text-[0.7rem] break-all text-zinc-400">
            sha256: {currentHash}
          </p>
        </Panel>

        <Panel title="İmzalar" index={1}>
          {contract.signatures.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Henüz imzalanmadı.
            </p>
          ) : (
            <ul className="flex flex-col gap-5">
              {contract.signatures.map((s) => {
                const matches = s.document_sha256 === currentHash;

                return (
                  <li key={s.id} className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {PARTY[s.party] ?? s.party}
                    </p>
                    <p className="tnum text-xs text-zinc-500 dark:text-zinc-400">
                      {when(s.signed_at)} · {String(s.ip_address)}
                    </p>
                    <p className="font-mono text-[0.7rem] break-all text-zinc-400">
                      {s.document_sha256}
                    </p>
                    {/* A mismatch is the whole reason the hash is stored: it
                        means the terms changed after this party signed. */}
                    <p
                      className={`text-xs ${
                        matches
                          ? "text-brand"
                          : "font-medium text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {matches
                        ? "Yukarıdaki metinle eşleşiyor."
                        : "Yukarıdaki metinle eşleşmiyor — bu imzadan sonra şartlar değişmiş."}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Geçmiş" index={2}>
        {!ledger || ledger.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Henüz bir hareket olmadı.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                  <th className="pb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Zaman
                  </th>
                  <th className="pb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Aşama
                  </th>
                  <th className="pb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Değişim
                  </th>
                  <th className="pb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Kim
                  </th>
                  <th className="pb-2 text-xs font-medium tracking-wide text-zinc-500 uppercase">
                    Gerekçe
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {ledger.map((row, index) => (
                  <tr
                    key={row.id}
                    className="reveal align-top"
                    style={{ "--i": index } as React.CSSProperties}
                  >
                    <td className="tnum py-3 pr-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                      {when(row.created_at)}
                    </td>
                    <td className="py-3 pr-4 text-zinc-950 dark:text-zinc-50">
                      {row.milestone
                        ? `${row.milestone.sequence_no}. ${row.milestone.title}`
                        : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        {row.from_status ? (
                          <StatusBadge status={row.from_status} />
                        ) : (
                          <span className="text-xs text-zinc-400">yeni</span>
                        )}
                        <span className="text-zinc-300 dark:text-zinc-600">→</span>
                        <StatusBadge status={row.to_status} />
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">
                      {/* SYSTEM here is the objection window closing. That is
                          the distinction the record exists to preserve:
                          accepted, or accepted by not objecting. */}
                      {ACTOR[row.actor_kind] ?? row.actor_kind}
                    </td>
                    <td className="max-w-[28ch] py-3 text-zinc-500 dark:text-zinc-400">
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
