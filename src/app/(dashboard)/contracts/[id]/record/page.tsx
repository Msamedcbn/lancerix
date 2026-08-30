import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/session";
import { hashDocument, renderContractDocument } from "@/lib/contracts/document";
import { getContract } from "@/lib/data/contracts";
import { createClient } from "@/lib/supabase/server";

const when = (value: string) => value.slice(0, 16).replace("T", " ");

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
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeading
          title="Record"
          subtitle={`${contract.reference} · ${contract.title}`}
        />
        <Button asChild variant="outline" size="sm">
          <Link href={`/contracts/${contract.id}`}>Back to contract</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signed text</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <pre className="bg-muted/40 overflow-x-auto rounded-lg border p-4 text-xs leading-relaxed whitespace-pre-wrap">
            {document}
          </pre>
          <p className="text-muted-foreground font-mono text-xs break-all">
            sha256: {currentHash}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          {contract.signatures.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Not signed yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {contract.signatures.map((s) => {
                const matches = s.document_sha256 === currentHash;
                return (
                  <div key={s.id} className="flex flex-col gap-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.party}</span>
                      <span className="text-muted-foreground">
                        {when(s.signed_at)} from {String(s.ip_address)}
                      </span>
                    </div>
                    <p className="text-muted-foreground font-mono text-xs break-all">
                      {s.document_sha256}
                    </p>
                    {/* A mismatch is the whole reason the hash is stored: it
                        means the terms changed after this party signed. */}
                    <p
                      className={
                        matches
                          ? "text-xs text-emerald-700"
                          : "text-destructive text-xs font-medium"
                      }
                    >
                      {matches
                        ? "Matches the text above."
                        : "Does not match the text above — the terms changed after this signature."}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          {!ledger || ledger.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing has happened yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground text-left">
                  <tr>
                    <th className="py-2 pr-4 font-medium">When</th>
                    <th className="py-2 pr-4 font-medium">Milestone</th>
                    <th className="py-2 pr-4 font-medium">Change</th>
                    <th className="py-2 pr-4 font-medium">By</th>
                    <th className="py-2 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row) => (
                    <tr key={row.id} className="border-t align-top">
                      <td className="text-muted-foreground py-2 pr-4 whitespace-nowrap">
                        {when(row.created_at)}
                      </td>
                      <td className="py-2 pr-4">
                        {row.milestone
                          ? `${row.milestone.sequence_no}. ${row.milestone.title}`
                          : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="flex items-center gap-2">
                          {row.from_status ? (
                            <StatusBadge status={row.from_status} />
                          ) : (
                            <span className="text-muted-foreground">new</span>
                          )}
                          <span className="text-muted-foreground">&rarr;</span>
                          <StatusBadge status={row.to_status} />
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {/* SYSTEM here is the objection window closing. That is
                            the distinction the record exists to preserve:
                            accepted, or accepted by not objecting. */}
                        {row.actor_kind === "SYSTEM" ? "Automatic" : row.actor_kind}
                      </td>
                      <td className="text-muted-foreground py-2">
                        {row.reason ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
