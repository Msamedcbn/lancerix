import "server-only";

import { createHash } from "node:crypto";

import { computeEscrowSplit, formatKurus } from "@/lib/escrow/money";
import type { AcceptanceCriterion, Contract, Milestone } from "@/lib/data/contracts";
import { describeCheck } from "@/lib/validations/acceptance-criteria";

export type DocumentParties = {
  freelancerName: string;
  clientName: string;
  company: {
    legal_name: string;
    vkn: string | null;
    tax_office: string | null;
    address: string | null;
  } | null;
};

/**
 * The exact text both parties sign, in Turkish, because both parties and the
 * tax treatment are Turkish.
 *
 * It has to be deterministic: the same contract must render byte for byte the
 * same text every time, or the hash each party signed would stop matching and
 * the signatures would look tampered with. Nothing here reads the clock or any
 * state outside the contract row and its milestones.
 *
 * LEGAL: the automatic acceptance clause in the QA_PLUS_ESCROW body, and the
 * liability-shield / direct-settlement clauses in the QA_ONLY body, have not
 * been reviewed by a lawyer. Have them reviewed before anyone other than the
 * author signs a contract generated from this.
 */
export function renderContractDocument(
  contract: Contract,
  milestones: Milestone[],
  parties: DocumentParties,
  criteria: AcceptanceCriterion[] = [],
): string {
  const header = [
    "HİZMET SÖZLEŞMESİ",
    `Referans: ${contract.reference}`,
    "",
    "TARAFLAR",
    `  Hizmeti veren : ${parties.freelancerName}`,
    `  Hizmeti alan  : ${parties.clientName}`,
    parties.company ? billingLine(parties.company) : "  Fatura edilen : —",
    "",
    "KONU",
    `  ${contract.title}`,
    "",
    "İŞİN KAPSAMI",
    indent(contract.scope_of_work),
    "",
  ];

  const body =
    contract.product_type === "QA_ONLY"
      ? qaOnlyBody(contract, criteria)
      : escrowBody(contract, milestones);

  const footer = [
    "",
    "İMZALAR",
    "  Hizmeti veren ve hizmeti alan, bu belgenin tamamını okuduklarını ve",
    "  kabul ettiklerini elektronik imzalarıyla beyan ederler.",
    "",
  ];

  return [...header, ...body, ...footer].join("\n");
}

/**
 * QA_ONLY: no escrow, no stopaj, no platform fee. Lancerix is a technical
 * auditor of the criteria below, not a party to payment -- see
 * docs/designs/pricing-client-pays-model.md for why Faz 1 avoids fund
 * custody entirely.
 */
function qaOnlyBody(
  contract: Contract,
  criteria: AcceptanceCriterion[],
): string[] {
  // The check itself is part of the signed terms, not an implementation
  // detail: "the homepage works" and "https://x.com returns HTTP 200" are
  // different promises, and the second is the one being made.
  const rows = criteria.map((c) => {
    const check = describeCheck(c.check_type, c.check_config);
    return check
      ? `  ${c.sequence_no}. ${c.description}\n     Kontrol: ${check}`
      : `  ${c.sequence_no}. ${c.description}`;
  });

  return [
    "KABUL KRİTERLERİ",
    rows.join("\n"),
    "",
    "DOĞRULAMA VE SORUMLULUK SINIRI",
    wrap(
      `Lancerix, bu sözleşmede yukarıda tanımlanan kabul kriterlerini teknik olarak test eden bağımsız bir denetim aracıdır; bir yazılım garanti kurumu değildir ve kodda sıfır açık veya hatasız yazılım garantisi vermez. Doğrulama sonucu, zaman damgalı bir rapor olarak taraflara sunulur.`,
    ),
    "",
    "TESLİM VE KABUL",
    wrap(
      `Hizmeti veren işi teslim eder ve teslim, yukarıdaki kabul kriterlerine göre doğrulama sürecine konu olur. Doğrulama tamamlandığında hizmeti alana bildirim yapılır ve ${contract.objection_window_days} günlük kontrol süresi başlar. Hizmeti alan bu süre içinde teslimata gerekçeli olarak itiraz edebilir veya açıkça onaylayabilir. Süre içinde itiraz edilmez ve onay verilmezse, teslimat bu sözleşme uyarınca KABUL EDİLMİŞ SAYILIR ve kabul, sistem tarafından zaman damgasıyla kayda geçirilir.`,
    ),
    "",
    "ÖDEME",
    wrap(
      `Doğrulama raporu olumlu dönse veya süre dolmasıyla kabul oluşsa dahi platform hiçbir ödemeyi serbest bırakmaz ve hiçbir aşamada taraflara ait parayı elinde tutmaz. Ödeme, taraflar arasında bu sözleşmenin dışında doğrudan çözülür. Platform ödemenin tarafı değildir.`,
    ),
    "",
    "KAYIT",
    wrap(
      `Bu sözleşmeye ilişkin imzalar, teslimler, doğrulama sonuçları, onaylar ve süre aşımıyla oluşan kabuller; zaman damgası ve belge özeti ile birlikte değiştirilemez bir kayıt defterinde tutulur.`,
    ),
  ];
}

/** QA_PLUS_ESCROW: the original milestone/escrow contract body, unchanged. */
function escrowBody(contract: Contract, milestones: Milestone[]): string[] {
  const ordered = [...milestones].sort((a, b) => a.sequence_no - b.sequence_no);

  const rows = ordered.map((m) => {
    const split = computeEscrowSplit({
      grossKurus: m.gross_amount_kurus,
      platformFeeBps: m.platform_fee_bps,
      stopajBps: m.stopaj_bps,
    });
    return [
      `  ${m.sequence_no}. ${m.title}`,
      `     Sözleşme bedeli : ${formatKurus(split.grossKurus)}`,
      `     Hizmet bedeli   : ${formatKurus(split.platformFeeKurus)} (müşteri öder)`,
      `     Müşteri toplamı : ${formatKurus(split.clientChargeKurus)}`,
      `     Stopaj          : ${formatKurus(split.taxWithholdingKurus)}`,
      `     Freelancer neti : ${formatKurus(split.freelancerNetKurus)}`,
      m.due_date ? `     Teslim tarihi   : ${m.due_date}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  const total = ordered.reduce((sum, m) => sum + m.gross_amount_kurus, 0);

  return [
    "AŞAMALAR VE BEDELLER",
    rows.join("\n\n"),
    "",
    `  Toplam sözleşme bedeli: ${formatKurus(total)}`,
    "",
    "ÖDEME VE KESİNTİLER",
    wrap(
      `Hizmet bedeli, hizmeti verenin sözleşme bedelinden kesilmez; bedelin üzerine eklenir ve hizmeti alan tarafından ödenir. Stopaj, serbest meslek makbuzunun düzenlendiği tam sözleşme bedeli üzerinden hesaplanır ve kanun gereği hizmeti alan tarafından kaynakta kesilerek vergi dairesine yatırılır. Bu sözleşmedeki oranlar imza anında dondurulmuştur; sonradan yapılan bir oran değişikliği bu sözleşmeye uygulanmaz.`,
    ),
    "",
    "TESLİM VE KABUL",
    wrap(
      `Hizmeti veren bir aşamayı teslim ettiğinde hizmeti alana bildirim yapılır ve ${contract.objection_window_days} günlük itiraz süresi başlar. Hizmeti alan bu süre içinde teslimata gerekçeli olarak itiraz edebilir veya teslimatı açıkça onaylayabilir. Süre içinde itiraz edilmez ve onay verilmezse, teslimat bu sözleşme uyarınca KABUL EDİLMİŞ SAYILIR ve kabul, sistem tarafından zaman damgasıyla kayda geçirilir. Bu hüküm, ödemenin belirsiz süreyle beklemesini önlemek amacıyla kararlaştırılmıştır.`,
    ),
    "",
    "İTİRAZ",
    wrap(
      `İtiraz edilen aşama, itirazın çözülmesine kadar askıya alınır ve itiraz süresi durur. İtiraz süreci, aşamanın serbest bırakılması veya iptali ile sonuçlanır.`,
    ),
    "",
    "KAYIT",
    wrap(
      `Bu sözleşmeye ilişkin imzalar, teslimler, onaylar ve süre aşımıyla oluşan kabuller; zaman damgası ve belge özeti ile birlikte değiştirilemez bir kayıt defterinde tutulur. Platform bu sözleşmenin tarafı değildir; yalnızca kaydı tutar.`,
    ),
  ];
}

/**
 * SHA-256 of the exact bytes signed. Stored alongside each signature so a later
 * edit to the terms is detectable: the stored hashes would no longer match what
 * the contract renders.
 */
export function hashDocument(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/**
 * VKN/vergi dairesi/adres are optional until invoicing (Faz 2) is active, so
 * the signed text only states what is actually on file rather than printing
 * "VKN undefined" for a QA-only contract.
 */
function billingLine(company: {
  legal_name: string;
  vkn: string | null;
  tax_office: string | null;
  address: string | null;
}): string {
  const vknPart = company.vkn ? ` (VKN ${company.vkn})` : "";
  const officePart = company.tax_office ? `, ${company.tax_office}` : "";
  const addressLine = company.address ? `\n                  ${company.address}` : "";
  return `  Fatura edilen : ${company.legal_name}${vknPart}${officePart}${addressLine}`;
}

const indent = (text: string) =>
  text
    .split("\n")
    .map((line) => `  ${line.trim()}`)
    .join("\n");

/** Fixed-width wrapping, so the signed bytes do not depend on a viewport. */
function wrap(text: string, width = 76): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    if (line === "") {
      line = word;
    } else if (`${line} ${word}`.length <= width) {
      line = `${line} ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== "") lines.push(line);

  return lines.map((l) => `  ${l}`).join("\n");
}
