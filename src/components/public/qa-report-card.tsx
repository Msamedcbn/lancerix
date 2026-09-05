import type { PublicQaReport } from "@/lib/data/public-report";
import { PROJECT_CATEGORY_INFO, type ProjectCategory } from "@/lib/validations/project-category";

const STATUS_LABEL: Record<string, string> = {
  PASS: "Kriterler karşılandı",
  FAIL: "Kriterler karşılanmadı",
  PARTIAL: "Kısmen karşılandı",
};

const STATUS_TONE: Record<string, string> = {
  PASS: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
  FAIL: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
};

/**
 * The report card, shared by the real shareable report (/report/[token]) and
 * the static example (/report/ornek). Same renderer for both on purpose: the
 * example has to be visually identical to a real report, or it teaches
 * visitors the wrong shape of thing to expect.
 *
 * `isExample` adds one unmissable badge and nothing else -- no watermarking
 * the numbers, no fake interactivity. The badge is the only thing standing
 * between this and a real, cryptographically-sealed verification, so it does
 * not get to be subtle.
 */
export function QaReportCard({
  report,
  isExample = false,
}: Readonly<{ report: PublicQaReport; isExample?: boolean }>) {
  const categoryLabel =
    PROJECT_CATEGORY_INFO[report.projectCategory as ProjectCategory]?.label ??
    report.projectCategory;

  return (
    <div className="fade-in flex flex-col gap-6 rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-md sm:p-10 dark:border-zinc-800/80 dark:bg-zinc-900/80">
      {isExample ? (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300">
          ÖRNEK RAPOR — gerçek bir doğrulama değildir
        </span>
      ) : null}

      <div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {categoryLabel}
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          {report.contractTitle}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Lancerix üzerinde bağımsız olarak doğrulanmış bir teslim raporu.
        </p>
      </div>

      <span
        className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold ${
          STATUS_TONE[report.status] ?? STATUS_TONE.PARTIAL
        }`}
      >
        {STATUS_LABEL[report.status] ?? report.status}
      </span>

      {report.criteria.length > 0 ? (
        <div>
          <h2 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
            Kabul Kriterleri
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {report.criteria.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
              >
                <span className="text-brand mt-0.5 font-bold">✓</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="border-t border-dashed border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="font-mono text-[0.7rem] break-all text-zinc-500 dark:text-zinc-400">
          {report.documentSha256}
        </p>
        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          Kriptografik özet · {report.generatedAt.slice(0, 16).replace("T", " ")} ·
          bu rapor kesinlikle değiştirilemez
        </p>
      </div>
    </div>
  );
}
