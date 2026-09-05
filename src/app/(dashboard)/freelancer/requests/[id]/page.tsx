import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeading } from "@/components/page-shell";
import { requireSession } from "@/lib/auth/session";
import { getProjectRequest } from "@/lib/data/project-requests";

import { DeclineRequest } from "../decline-request";

/**
 * The deep link the notification email points at.
 *
 * requireSession() rather than requireRole("FREELANCER") on purpose: an email
 * invite goes to someone who may have just signed up, and getProjectRequest()
 * is what claims the request onto their account. Bouncing them on role before
 * that runs would leave a freelancer staring at a permission error on a link
 * addressed to them.
 */
export default async function ProjectRequestPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requireSession();
  const { id } = await params;

  const request = await getProjectRequest(id);
  if (!request) notFound();

  return (
    <div className="flex flex-col gap-8">
      <PageHeading title={request.title} subtitle="Proje talebi" />

      <article className="flex flex-col gap-5 rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/80">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {request.brief}
        </p>

        {request.status === "OPEN" ? (
          <div className="flex flex-wrap items-start gap-2 border-t border-zinc-100 pt-5 dark:border-zinc-800/60">
            <Link
              href={`/freelancer/new?request=${request.id}`}
              className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground shadow-md shadow-brand/20 transition-all hover:bg-brand/90 active:scale-[0.98]"
            >
              Sözleşmeye dönüştür →
            </Link>
            <DeclineRequest requestId={request.id} />
          </div>
        ) : request.status === "CONVERTED" && request.contract_id ? (
          <Link
            href={`/contracts/${request.contract_id}`}
            className="self-start text-xs font-semibold text-brand underline underline-offset-4"
          >
            Sözleşmeyi gör →
          </Link>
        ) : (
          <p className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs leading-relaxed text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            Bu talep reddedildi
            {request.decline_reason ? `: ${request.decline_reason}` : "."}
          </p>
        )}
      </article>
    </div>
  );
}
