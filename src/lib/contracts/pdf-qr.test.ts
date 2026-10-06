import { describe, expect, it } from "vitest";
import { renderContractPdf } from "./pdf";

describe("PDF Renderer with Dynamic HMK 193 QR Code", () => {
  it("renders a valid PDF document with DejaVu Sans Mono", async () => {
    const documentText = "LANCERIX SOZLESME METNI\nReferans: LCX-2026-TEST\nProje: Test Projesi";
    const pdfBytes = await renderContractPdf(documentText, {
      reference: "LCX-2026-TEST",
      title: "Test Sözleşmesi",
    });

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(100);

    // Check PDF magic header %PDF-
    const header = Buffer.from(pdfBytes.slice(0, 5)).toString("utf-8");
    expect(header).toBe("%PDF-");
  });

  it("embeds dynamic verification QR code when verifyUrl is provided", async () => {
    const documentText = "LANCERIX HAKEMLIK DOSYASI\nReferans: LCX-2026-85000-KUYUMCU\nTBK m. 477 Zimni Kabul";
    const pdfBytes = await renderContractPdf(documentText, {
      reference: "LCX-2026-85000-KUYUMCU",
      title: "Kuyumculuk Bilirkişi Raporu",
      verifyUrl: "https://app.lancerix.com/verify/LCX-2026-85000-KUYUMCU",
    });

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // PDF with QR image should be larger than plain PDF
    const plainBytes = await renderContractPdf(documentText, {
      reference: "LCX-2026-85000-KUYUMCU",
      title: "Kuyumculuk Bilirkişi Raporu",
    });

    expect(pdfBytes.length).toBeGreaterThan(plainBytes.length);
  });
});
