# Lancerix — Autonomous Security Hygiene Scanning SaaS

Lancerix's core product, as of the 2026-09-27 pivot, is an autonomous
**security hygiene scanning** engine: given a target URL, it runs a passive,
non-intrusive audit (HTTP security headers, form/cookie hygiene, known
sensitive file exposure, TLS enforcement), produces an SHA-256 sealed,
timestamped report, and suggests remediation code. It is explicitly **not**
a penetration test — no exploit attempts, no port scanning, no
authentication bypass, no CVE database. Every user-facing surface must stay
honest about this distinction; see "Honest positioning" below before adding
or editing any copy that touches severity, CVSS, or OWASP language.

## Product history (read this before assuming either era is "the app")

This codebase carries two products, one active and one dormant, because the
pivot replaced the navigation and homepage without deleting the earlier
code:

1. **Active: the security hygiene scanner** (below). This is what a
   freelancer/client/admin session lands on today — `NAV` in
   `src/app/(dashboard)/layout.tsx` points every role at `SECURITY_NAV`.
2. **Dormant: the Faz 1 freelance verification marketplace.** A 3-way
   contract-bound QA product (`src/app/(dashboard)/contracts`,
   `src/app/(dashboard)/freelancer`, `src/app/(dashboard)/client`), an
   escrow state machine (`src/lib/escrow`), and stopaj/e-invoice tax
   handling (`src/lib/tax`) — all still on disk, still schema-complete,
   **but unreachable from navigation** and not the product being built
   against. Confirmed a deliberate, full pivot (2026-09-30) — not a bug to
   fix, not an oversight to restore. Do not extend this code path or route
   users into it without an explicit instruction that Faz 1/Faz 2 is back
   in scope; treat it as a reference implementation of a different product,
   not dead code to casually delete either.

If a future session needs `git log`/`git blame` on this: the pivot commits
are dated around 2026-09-27 and arrived uncommitted (17 days of local work,
reviewed and cleaned up on 2026-09-30 — see
`~/.gstack/projects/demearac/` for that session's notes if present).

## Honest positioning (non-negotiable)

The scanning engine (`src/lib/security/vuln-engine.ts`) does exactly what a
visitor's browser could already do: one `fetch()`, a handful of harmless
probes (`/.git/HEAD`, `/.env`, `/.well-known/security.txt`), header
inspection, and cheerio-based form/cookie analysis. It does **not** run
Nuclei, does not query a CVE database, does not attempt IDOR/injection/auth
bypass, and cannot guarantee zero false positives (it's a rule-based
checker, not a validated PoC engine).

- Never market or label this as "penetration testing," "CVE scanning," or
  claim a specific CVE/OWASP-category coverage the engine doesn't run.
  "CVSS score" in the UI is labeled "Risk Puanı" for exactly this reason —
  it's a severity-derived internal number, not a real CVSS calculation.
- The public report (`src/app/audit/[scanId]/page.tsx`) carries an explicit
  "what this scan is and isn't" disclosure box (2026-10-01) — keep it
  whenever that page is touched; this is the page that gets embedded/shared
  externally as a trust signal, so it's the highest-stakes place for this
  to stay honest.
- OWASP Top 10 references are fine as a *categorization taxonomy* for
  findings (`src/lib/security/compliance.ts` maps findings to OWASP/SOC 2
  controls) — never as a claim that all 10 categories were actively tested.
- Nuclei CLI (v3.11.1) and its templates are provisioned on the local dev
  machine for a **future, not-yet-built** active-scanning tier — see
  `coban-main-design-20260913-180412.md`'s Approach C. Building it requires
  DNS-verified domain ownership, a revocable consent ledger, a template
  whitelist, and its own worker (Vercel's 300s limit can't run a 2,000+
  template Nuclei scan) — do not casually wire raw Nuclei into the existing
  passive-scan path.

## Core surfaces

- **Marketing homepage** (`src/app/home-client.tsx`,
  `src/lib/i18n/dictionaries/home.ts`) — hero, positioning, an instant
  free-scan widget (`src/components/home/instant-audit-scanner.tsx`), and
  the pricing section (`id="fiyat"`). TR is the source of truth; EN is a
  parallel mirror under `/en` (see `src/lib/i18n/config.ts`'s
  `PUBLIC_ROUTES`).
- **Security dashboard** (signed-in, `src/app/(dashboard)/`):
  `dashboard` (command center), `targets` (registered URLs + DNS_TXT/
  META_TAG ownership verification, `src/lib/security/verifier.ts`), `scans`
  (per-target scan history, live agent log terminal), `vulnerabilities`
  (cross-target open findings list), `compliance` (OWASP Top 10 / SOC 2
  mapping, `src/lib/security/compliance.ts`), `settings/api-keys`,
  `settings/integrations` (Slack/Discord/generic webhook alerts,
  `src/lib/notify/webhook.ts`), `settings/white-label` (Ajans-plan-gated
  branding, see below), and the still-live `izleme` (continuous monitoring
  subscriptions) and `site-kontrol` (one-time scan purchase + admin
  free-trial) pages inherited from the pre-pivot product.
- **Public developer API** — `POST /api/v1/scan`
  (`src/app/api/v1/scan/route.ts`), authenticated with a `lx_sec_...` key
  (`src/app/(dashboard)/api-key-actions.ts`, sha256-hashed at rest). **Only
  scans a target the caller already verified through the dashboard** — it
  does not auto-create or auto-verify a target from an API call (fixed
  2026-10-01; the previous `MANUAL_EXEMPT` auto-verify path let any API key
  holder scan any URL with zero ownership proof, exactly the kind of gap a
  leaked key could exploit at scale). `verifyTargetAction`
  (`src/app/(dashboard)/security-actions.ts`) is the only way a target
  becomes verified; `startSecurityScanAction` and the API route both check
  `is_verified` before scanning.
- **Public audit report** — `GET /audit/[scanId]`
  (`src/app/audit/[scanId]/page.tsx`), no auth required (listed in
  `PUBLIC_ROUTES`, `src/lib/supabase/middleware.ts`). SHA-256 sealed,
  supports white-label branding (see below), embeddable via
  `GET /api/badge/[targetId]`.

## Database (security_* tables, `supabase/migrations/2026092{7,7,7}*.sql`)

`security_targets`, `security_scans`, `security_vulnerabilities`,
`security_scan_logs`, `security_api_keys`, `security_integrations`,
`security_agency_branding` — every one RLS'd to `user_id = auth.uid() or
is_admin()` (branding's `select` policy is deliberately `using (true)` so
the public report page can read it for a stranger). No `security_*` table
tracks billing/plan state — subscriptions (below) live entirely in
`monitoring_subscriptions`, a pre-pivot table this product reuses rather
than duplicates.

## Subscriptions & billing (Polar, `POLAR_ORGANIZATION_ID` in env)

There is **one** subscription product line, not per-tier duplicates:
`monitoring_subscriptions` (`subscriber_id`, `plan_id` in `MONITORING` |
`AGENCY`, `status`, `provider_reference`) with real, live Polar products
(`POLAR_PRODUCT_MONITORING`, `POLAR_PRODUCT_AGENCY`; checkout via
`createMonitoringCheckout` in `src/lib/polar.ts` — no `amount` override, no
fallback product, same regional-pricing discipline as every other Polar
checkout here). Canonical pricing lives in `MONITORING_PLANS`
(`src/lib/validations/monitoring.ts`), **not** in homepage copy — always
read the actual prices from there before writing a number anywhere:

- `MONITORING` ("İzleme"): ₺799/$79/€79 per month, 3 sites.
- `AGENCY` ("Ajans"): ₺3.500/$349/€349 per month, 5 sites, `whiteLabel:
  true`.

**White-labeling is an Ajans-plan feature, not a separate product.** A
homepage-copy-only "$499/mo" and "$299/mo Agency" tier existed briefly in
the 2026-09-27 pivot with no backing Polar product or subscription table —
reconciled 2026-10-01 by gating `security_agency_branding` behind an active
`monitoring_subscriptions` row (`plan_id='AGENCY', status='ACTIVE'`) via
`hasActiveAgencySubscription()` (`src/app/(dashboard)/agency-branding-actions.ts`).
Both the settings-page write path and the public report's read path
re-check the live subscription rather than trusting the branding row's own
`is_active` flag — a canceled Ajans subscription stops white-labeling
reports the same day, the same "ACTIVE status is the authorization" rule
`src/lib/qa/monitoring-run.ts` already applies to scanning itself. Do not
build a second, differently-priced Agency product without archiving or
reconciling this one first.

**One-time purchase**: the standalone package system inherited from the
pre-pivot product (`src/lib/validations/standalone-qa.ts`,
`STANDALONE_PACKAGE_IDS`). `BASIC`/`PRO`/`FULL` are archived in Polar (zero
real customers, ever) and no longer marketed, though still technically
orderable from `/site-kontrol`. The one live, purchasable package is
`DISPUTE_SHIELD` (internal id only — user-facing label is **"Güvenlik
Mührü & Denetim"**, merged into the security brand 2026-09-27/2026-10-01):
₺349/$29/€29, bundling the four checks with actual evidentiary value
(interaction scan, form validation, dead links, visual overflow). A $29/mo
"Retainer" tier is shown as a non-interactive "coming soon" card — real
usage metering is deliberately deferred; don't build it speculatively.

**Every Polar product ID env var must be mirrored in both `.env.local` and
Vercel production env vars** (`vercel env add/rm ... production`) — they
drift independently and a missing production var silently falls back to
the wrong product or a generic checkout.

## AI remediation

`src/lib/security/remediation-agent.ts` (`generateRemediationPatch`, uses
`gpt-4o-mini` via `OPENAI_API_KEY`, gracefully falls back to a static
message with no key or on any LLM error) is wired into both scan paths via
`enrichFindingsWithRemediation()` — every finding's `remediation_patch` is
LLM-tailored to the actual target/evidence, not a fixed string per finding
type. If you add a third place that inserts into `security_vulnerabilities`,
call this enrichment there too or findings will ship generic patches again.

## Layout

```
src/app/(dashboard)/targets          register + verify scan targets (DNS_TXT/META_TAG)
src/app/(dashboard)/scans            scan history, live agent log terminal
src/app/(dashboard)/vulnerabilities  cross-target open findings
src/app/(dashboard)/compliance       OWASP Top 10 / SOC 2 mapping
src/app/(dashboard)/settings         api-keys, integrations, white-label
src/app/(dashboard)/izleme           continuous monitoring subscriptions (pre-pivot, still active)
src/app/(dashboard)/site-kontrol     one-time scan purchase + admin free-trial (pre-pivot, still active)
src/app/api/v1                       public developer REST API
src/app/api/badge                    embeddable security badge
src/app/audit/[scanId]               public, no-auth audit report
src/lib/security                     vuln-engine, verifier, compliance, remediation-agent, types
src/app/(dashboard)/contracts        DORMANT -- Faz 1 contract-bound QA, not navigated to
src/app/(dashboard)/freelancer       DORMANT -- Faz 1 marketplace role
src/app/(dashboard)/client           DORMANT -- Faz 1 marketplace role
src/lib/escrow                       DORMANT -- Faz 2 escrow state machine, never activated
src/lib/tax                          DORMANT -- stopaj/e-invoice, Faz 2 only
supabase/migrations                  schema, RLS policies -- both active and dormant tables
```

## Non-negotiable rules

**Honest scanning language.** See "Honest positioning" above — this is the
rule most likely to be silently violated by copy-only changes (a new
homepage section, a new plan description) that don't touch code.

**Security.** RLS on every table, no exceptions. A target's ownership
verification (`is_verified`) gates every scan trigger — UI action, and API
route alike; never let a new scan-triggering code path skip this check
(the exact bug fixed 2026-10-01 in `POST /api/v1/scan`).

**Subscriptions.** A feature gated by a paid plan (white-label, API rate
limits if added later) must check the **live** `monitoring_subscriptions`
row at the point of use, not a cached/stale flag set at write time.

**Types.** Strict TypeScript, no `any` — use `Tables<"table_name">` from
`src/lib/supabase/database.types.ts` for typed Supabase query results
instead of casting to `any`. Zod for every form and API boundary. Server
Actions for mutations, with `revalidatePath`. Secrets come from env vars
only — never hardcoded.

**Money** (wherever it still applies — Polar checkout amounts, the dormant
escrow ledger). Every amount is an integer of minor units (kurus for TRY,
cents for USD/EUR). Regional pricing (TRY/USD/EUR) is a willingness-to-pay
decision set independently on each Polar product — never derive one
currency from another algorithmically.

## Environment

Docker is not used on this machine. Verify schema changes against a hosted
Supabase project (`supabase db push`), never `supabase start` / `supabase
db reset`. If a migration references `gen_random_bytes()` or another
pgcrypto function, schema-qualify it as `extensions.gen_random_bytes(...)`
— this hosted project has pgcrypto installed in the `extensions` schema,
outside `public`'s default search_path, and an unqualified call fails with
"function does not exist" even though `create extension if not exists
pgcrypto` succeeds.

Run `npm run test` (vitest), `npm run typecheck`, and `npm run lint` before
considering a change done. `npm run build` needs the three `NEXT_PUBLIC_*`
vars. Production deploys go through `vercel deploy --prod` (project
`samed-s-projects/lancerix`) — a plain `git push` to `main` does not deploy
by itself unless GitHub auto-deploy is separately confirmed active; push to
GitHub *and* deploy to Vercel are two different actions here.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
