import { ImageResponse } from "next/og";

import { OG_IMAGE_SIZE, renderOgImage } from "@/lib/og-image";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "Lancerix — Bağımsız Kod Doğrulama";

/**
 * Default Open Graph image for every route that doesn't sit under /en --
 * see src/app/en/opengraph-image.tsx for the English override and
 * src/lib/og-image.tsx for the shared visual.
 */
export default function Image() {
  return new ImageResponse(renderOgImage("Bağımsız Kod Doğrulama"), size);
}
