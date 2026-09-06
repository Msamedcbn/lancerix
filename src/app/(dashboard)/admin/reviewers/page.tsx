import { EmptyState, PageHeading, Panel, Row, Rows } from "@/components/page-shell";
import { requireRole } from "@/lib/auth/session";
import { listReviewersWithProfile } from "@/lib/data/admin-users";

import { AddReviewerForm, ReviewerActiveToggle, ReviewerRateForm } from "./reviewer-form";

const LEVEL_LABEL: Record<string, string> = {
  PRINCIPAL: "Principal / Lead",
  SENIOR: "Senior",
};

export default async function AdminReviewersPage() {
  await requireRole("ADMIN");
  const reviewers = await listReviewersWithProfile();

  return (
    <>
      <PageHeading
        title="Mühendis kadrosu"
        subtitle="Tier 3/4 için müşterinin seçtiği roster. Sadece aktif olanlar TierPicker'da görünür."
      />

      <Panel title="Yeni mühendis ekle">
        <AddReviewerForm />
      </Panel>

      {reviewers.length === 0 ? (
        <EmptyState
          title="Kadro boş"
          description="Henüz eklenmiş bir mühendis yok. Tier 3 ve Tier 4 siparişleri bir isim olmadan verilemez."
        />
      ) : (
        <Rows>
          {reviewers.map((r) => (
            <Row key={r.id}>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      {r.displayName}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {r.displayEmail}
                      {!r.hasAccount && (
                        <span className="ml-1.5 rounded-full bg-sky-50 px-1.5 py-0.5 text-[0.65rem] font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                          Hesabı yok
                        </span>
                      )}
                    </p>
                    <p className="tnum mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {LEVEL_LABEL[r.level] ?? r.level} · {r.years_experience}+ yıl deneyim
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        r.active
                          ? "bg-brand-muted text-brand"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
                      }`}
                    >
                      {r.active ? "Aktif" : "Pasif"}
                    </span>
                    <ReviewerActiveToggle reviewer={r} />
                  </div>
                </div>

                {r.specialties.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {r.specialties.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 text-[0.7rem] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : null}

                {r.bio ? (
                  <p className="max-w-[70ch] text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {r.bio}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Tier 3/4 ücreti:
                  </span>
                  <ReviewerRateForm reviewer={r} />
                  {r.rate_kurus === null ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.7rem] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      Ücret girilmedi -- Tier 3/4&apos;te seçilemez
                    </span>
                  ) : null}
                </div>
              </div>
            </Row>
          ))}
        </Rows>
      )}
    </>
  );
}
