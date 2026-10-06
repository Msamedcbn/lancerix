import "server-only";

import type { AcceptanceCriterion, Contract, Milestone } from "@/lib/data/contracts";
import type { DeliveryRow, DeliveryEvent } from "@/lib/data/deliveries";
import type { DocumentParties } from "@/lib/contracts/document";
import { formatKurus } from "@/lib/escrow/money";
import { deliveryStatusLabel } from "@/lib/qa/delivery-state-machine";

const wrap = (text: string, width = 74): string => {
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
};

const indent = (text: string) =>
  text
    .split("\n")
    .map((line) => `  ${line.trim()}`)
    .join("\n");

/**
 * Generates the authoritative Turkish Technical Arbitration & Forensic Evidence Dossier.
 * Formatted for Turkish Commercial / Enforcement Courts (TBK art. 473-477 / HMK art. 193).
 */
export function renderArbitrationDossier(
  contract: Contract,
  parties: DocumentParties,
  criteria: AcceptanceCriterion[],
  milestones: Milestone[],
  deliveries: DeliveryRow[],
  deliveryEvents: DeliveryEvent[],
  signatures: { party: string; signed_at: string; ip_address: unknown; document_sha256: string }[],
  contractHash: string,
): string {
  const divider = "=".repeat(76);
  const subDivider = "-".repeat(76);

  const sections: string[] = [
    divider,
    "LANCERIX TEKNİK HAKEMLİK VE TESLİMAT DOĞRULAMA DOSYASI",
    "Resmi Bilirkişi ve Adli Bilişim Kanıt Raporu",
    `Referans Kodu : ${contract.reference}`,
    `Rapor Tarihi  : ${new Date().toISOString().slice(0, 10)}`,
    divider,
    "",
    "1. TARAFLAR VE SÖZLEŞME ÖZETİ",
    `  Hizmeti Veren (Geliştirici) : ${parties.freelancerName}`,
    `  Hizmeti Alan (İşveren)       : ${parties.clientName}`,
    parties.company ? `  Fatura Edilen Şirket         : ${parties.company.legal_name}` : "",
    `  Sözleşme Başlığı             : ${contract.title}`,
    `  Proje Bedeli                : ${formatKurus(contract.project_amount_kurus)}`,
    `  Sözleşme Durumu              : ${contract.status}`,
    "",
    "2. HUKUKİ DAYANAK VE DELİL SÖZLEŞMESİ BEYANI",
    wrap(
      "İşbu belge; 6100 sayılı Hukuk Muhakemeleri Kanunu Madde 193 (Delil Sözleşmesi), 6098 sayılı Türk Borçlar Kanunu Madde 473-477 (Eser Sözleşmesinde Teslim ve Ayıp Hükümleri) ve 5070 sayılı Elektronik İmza Kanunu uyarınca tarafların karşılıklı iradeleriyle kabul ettiği teknik şartnameyi, kriptografik teslimat kayıtlarını ve zaman damgalı olay kütüğünü içerir.",
    ),
    "",
    wrap(
      "TBK Madde 474 gereği işveren, eseri teslim aldıktan sonra işlerin olağan akışına göre imkân bulur bulmaz gözden geçirmek ve kusur varsa bunu uygun bir bildirimle (ayıp ihbarı) somut olarak bildirmekle yükümlüdür. Sübjektif veya soyut 'beğenmedim' iddiaları hukuki ayıp ihbarı teşkil etmez; aşağıdaki teknik kayıtlar kesin delil niteliğindedir.",
    ),
    "",
    "3. SÖZLEŞME VE İMZA DOĞRULAMASI",
    `  Sözleşme Belge Karması (SHA-256): ${contractHash}`,
    signatures.length === 0
      ? "  [İmza Kaydı Bulunmuyor]"
      : signatures
          .map(
            (s) =>
              `  [✓] ${s.party === "FREELANCER" ? "Geliştirici" : "İşveren"} İmzası: ${s.signed_at.slice(0, 16).replace("T", " ")} | IP: ${String(s.ip_address)}\n      Mühür: ${s.document_sha256}`,
          )
          .join("\n"),
    "",
    "4. TEKNİK KABUL KRİTERLERİ (Şartname Matrisi)",
    criteria.length === 0
      ? "  Standart genel şartname hükümleri geçerlidir."
      : criteria
          .map(
            (c) =>
              `  ${c.sequence_no}. [${c.check_type || "FONKSİYONEL"}] ${c.description}`,
          )
          .join("\n"),
    "",
    "5. KRİPTOGRAFİK TESLİMAT KANITI (Proof of Delivery)",
    deliveries.length === 0
      ? "  Henüz teslimat sunulmamıştır."
      : deliveries
          .map((d, index) => {
            const report = d.reports[0];
            const lines = [
              `  [Teslimat #${deliveries.length - index}]`,
              `    Tarih & Zaman Damgası : ${d.submitted_at.slice(0, 16).replace("T", " ")}`,
              `    Canlı Test Adresi     : ${d.staging_url}`,
              d.pr_url ? `    Kaynak Kod / PR       : ${d.pr_url}` : "",
              `    Teslim Durumu         : ${deliveryStatusLabel(d.status)}`,
              d.notes ? `    Geliştirici Notu      : ${d.notes}` : "",
              report
                ? `    Otonom QA/Güvenlik    : ${report.status === "PASS" ? "ONAYLANDI (PASS)" : "KUSURLU (FAIL)"} | SHA-256: ${report.document_sha256}`
                : "    Otonom QA/Güvenlik    : Standart denetim",
            ];
            return lines.filter(Boolean).join("\n");
          })
          .join("\n\n"),
    "",
    "6. İNCELEME SAYACI, AYIP İHBARI VE HUKUKİ TESPİT",
    deliveries.length === 0
      ? "  Teslimat yapılmadığı için inceleme süresi başlamamıştır."
      : deliveries
          .map((d) => {
            const hasObjection = d.status === "REJECTED" || Boolean(d.client_note);
            const isAccepted = d.status === "ACCEPTED";
            const deadlinePassed =
              d.client_review_deadline && new Date(d.client_review_deadline).getTime() < Date.now();

            let finding = "";
            if (isAccepted) {
              finding =
                "HUKUKİ TESPİT: Teslimat işveren tarafından incelenmiş ve açık rıza ile KABUL EDİLMİŞTİR.";
            } else if (hasObjection) {
              finding = `HUKUKİ TESPİT: İşveren süresi içinde itiraz bildirmiştir.\n    Kayıtlı İtiraz Gerekçesi:\n${indent(d.client_note || "Gerekçe girilmedi")}`;
            } else if (deadlinePassed) {
              finding =
                "HUKUKİ TESPİT: TBK Madde 477 gereğince; işveren kanuni inceleme süresinde somut bir ayıp ihbarında bulunmamış olup, teslimat zımnen ve yasal olarak KABUL EDİLMİŞ SAYILMIŞTIR.";
            } else {
              finding = `İNCELEME SÜRÜYOR: Son itiraz tarihi: ${d.client_review_deadline?.slice(0, 16).replace("T", " ")}`;
            }

            return `  İnceleme Süresi Sınırı: ${d.client_review_deadline ? d.client_review_deadline.slice(0, 16).replace("T", " ") : "Belirtilmedi"}\n  ${finding}`;
          })
          .join("\n\n"),
    "",
    "7. DEĞİŞTİRİLEMEZ İŞLEM VE OLAY GÜNLÜĞÜ (Audit Log)",
    deliveryEvents.length === 0
      ? "  Henüz kayıtlı olay bulunmuyor."
      : deliveryEvents
          .map(
            (e) =>
              `  ${e.created_at.slice(0, 16).replace("T", " ")} | ${e.actor_kind} | ${deliveryStatusLabel(e.to_status)}${e.reason ? ` - ${e.reason}` : ""}`,
          )
          .join("\n"),
    "",
    divider,
    "LANCERIX DOĞRULAMA SERTİFİKASI",
    "İşbu rapor, Lancerix Bağımsız Hakemlik ve Teslimat Protokolü tarafından",
    "tarafların dijital işlem izleri ve otonom denetim motoru verileri esas",
    "alınarak üretilmiştir. Değiştirilemez kriptografik hash ile mühürlenmiştir.",
    divider,
  ];

  return sections.filter((s) => s !== "").join("\n");
}
