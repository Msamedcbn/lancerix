import { appUrl } from "@/lib/env.server";
import { PUBLIC_ROUTES } from "@/lib/i18n/config";

/**
 * A route, not a static file, so the links below are built from
 * PUBLIC_ROUTES/appUrl() rather than a hand-typed domain that could drift
 * from reality the way the root layout's stale description already did once
 * tonight. English throughout regardless of viewer -- that's the emerging
 * llms.txt convention, and this file is read by crawlers, not people.
 */
export function GET() {
  const base = appUrl();
  const body = `# Lancerix

> Independent, third-party verification for freelance and agency software delivery. Lancerix checks whether delivered work meets the acceptance criteria written into its contract, and issues a timestamped, cryptographically-sealed report. It is not an escrow service, not a law firm, and not a security audit -- it verifies stated criteria only.

Payment happens directly between the freelancer and the client; Lancerix never holds funds, issues invoices, or processes payment on either party's behalf.

## Guides

- [Freelance Delivery & Acceptance Guide](${base}${PUBLIC_ROUTES.guideDeliveryAcceptance.en}): what an acceptance criterion is, what to do at the moment of delivery, how to handle a dispute, and what a "silence counts as acceptance" clause means.
- [What Is Independent QA Verification](${base}${PUBLIC_ROUTES.guideQaVerification.en}): how independent QA verification differs from a security audit, what each of the four verification tiers covers, and which tier fits which project.
- [How To Protect Yourself Freelancing Without A Company](${base}${PUBLIC_ROUTES.guideNoCompanyProtection.en}): why an individual freelancer's contract is exactly as binding as a company's, and what actually protects you before you've reached the income level where forming one makes sense.
- [What To Do If A Client Doesn't Pay](${base}${PUBLIC_ROUTES.guideClientNonPayment.en}): why a clean verification report is evidence, not a payment guarantee, and what recourse -- formal debt collection, a shareable public report -- actually exists in Faz 1.
- [Example verification report](${base}/report/ornek): what a real Lancerix verification report contains.

## Product

- [Overview](${base}${PUBLIC_ROUTES.home.en}): the verification flow and pricing tiers.
- [Trust architecture](${base}${PUBLIC_ROUTES.trustArchitecture.en}): the concrete, database-enforced mechanisms (integer-only money, single-door state transitions, an append-only ledger, row-level security) behind the "you can trust this report" claim.
- [Roadmap](${base}${PUBLIC_ROUTES.roadmap.en}): what's live today versus planned.
- [Terms of service](${base}${PUBLIC_ROUTES.terms.en})
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
