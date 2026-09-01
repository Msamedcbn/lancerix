import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb } from "pdf-lib";

/**
 * Renders the exact signed text as a PDF, monospace, one page per overflow.
 *
 * The source text is already fixed-width wrapped at 76 columns (see
 * document.ts's wrap()), which is what makes a monospace PDF the right
 * choice here rather than reflowed prose -- the same bytes that were hashed
 * and signed are what gets drawn, line for line.
 *
 * DejaVu Sans Mono, not a Google Fonts family: JetBrains Mono and Roboto
 * Mono (both fontmake/ufo2ft-built) render as tofu/missing glyphs through
 * pdf-lib's fontkit embedding on this stack -- verified by testing five
 * fonts before landing on this one. DejaVu is an old FontForge-built font
 * with full Turkish (Latin Extended-A) and ₺ (U+20BA) coverage and embeds
 * cleanly. Its license (public/fonts/DejaVuSansMono-LICENSE.txt) permits
 * redistribution and embedding.
 */

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const FONT_SIZE = 9.5;
const LINE_HEIGHT = 13;

let cachedFontBytes: Buffer | null = null;

async function loadFontBytes(): Promise<Buffer> {
  if (!cachedFontBytes) {
    cachedFontBytes = await readFile(
      path.join(process.cwd(), "public", "fonts", "DejaVuSansMono.ttf"),
    );
  }
  return cachedFontBytes;
}

export async function renderContractPdf(
  documentText: string,
  meta: { reference: string; title: string },
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await loadFontBytes());

  pdf.setTitle(`${meta.reference} — ${meta.title}`);
  pdf.setProducer("Lancerix");
  pdf.setCreator("Lancerix");

  const usableWidth = PAGE_WIDTH - MARGIN * 2;
  const lines = documentText
    .split("\n")
    .flatMap((line) => wrapToWidth(line, font, FONT_SIZE, usableWidth));

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  for (const line of lines) {
    if (y < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    if (line) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font,
        color: rgb(0.12, 0.12, 0.12),
      });
    }
    y -= LINE_HEIGHT;
  }

  return pdf.save();
}

/**
 * Defensive re-wrap in points, not characters: document.ts wraps at 76
 * columns assuming a roughly-fixed glyph width, which holds for DejaVu Sans
 * Mono at this size, but a line this function did not itself wrap (a raw
 * title, a long company name) could still be too wide. Splitting on actual
 * measured width means a page can never clip text off its right edge.
 */
function wrapToWidth(
  line: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  maxWidth: number,
): string[] {
  if (font.widthOfTextAtSize(line, size) <= maxWidth) return [line];

  const words = line.split(" ");
  const out: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) out.push(current);
    // A single word wider than the page (a long unbroken token) still has to
    // land somewhere -- break it by character rather than overflow silently.
    if (font.widthOfTextAtSize(word, size) > maxWidth) {
      let chunk = "";
      for (const ch of word) {
        const next = chunk + ch;
        if (font.widthOfTextAtSize(next, size) > maxWidth) {
          out.push(chunk);
          chunk = ch;
        } else {
          chunk = next;
        }
      }
      current = chunk;
    } else {
      current = word;
    }
  }
  if (current) out.push(current);
  return out;
}
