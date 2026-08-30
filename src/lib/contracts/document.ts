import "server-only";

import { createHash } from "node:crypto";

import { computeEscrowSplit, formatKurus } from "@/lib/escrow/money";
import type { Contract, Milestone } from "@/lib/data/contracts";

export type DocumentParties = {
  freelancerName: string;
  clientName: string;
  company: {
    legal_name: string;
    vkn: string;
    tax_office: string;
    address: string;
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
 * LEGAL: the automatic acceptance clause below has not been reviewed by a
 * lawyer. It is the load-bearing term of this agreement and it decides when a
 * delivery counts as accepted. Have it reviewed before anyone other than the
 * author signs a contract generated from it.
 */
export function renderContractDocument(
  contract: Contract,
  milestones: Milestone[],
  parties: DocumentParties,
): string {
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
    "HİZMET SÖZLEŞMESİ",
    `Referans: ${contract.reference}`,
    "",
    "TARAFLAR",
    `  Hizmeti veren : ${parties.freelancerName}`,
    `  Hizmeti alan  : ${parties.clientName}`,
    parties.company
      ? `  Fatura edilen : ${parties.company.legal_name} (VKN ${parties.company.vkn}), ${parties.company.tax_office}\n                  ${parties.company.address}`
      : "  Fatura edilen : —",
    "",
    "KONU",
    `  ${contract.title}`,
    "",
    "İŞİN KAPSAMI",
    indent(contract.scope_of_work),
    "",
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
    "",
    "İMZALAR",
    "  Hizmeti veren ve hizmeti alan, bu belgenin tamamını okuduklarını ve",
    "  kabul ettiklerini elektronik imzalarıyla beyan ederler.",
    "",
  ].join("\n");
}

/**
 * SHA-256 of the exact bytes signed. Stored alongside each signature so a later
 * edit to the terms is detectable: the stored hashes would no longer match what
 * the contract renders.
 */
export function hashDocument(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
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
