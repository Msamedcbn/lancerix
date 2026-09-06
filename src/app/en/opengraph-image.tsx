import { ImageResponse } from "next/og";

import { OG_IMAGE_SIZE, renderOgImage } from "@/lib/og-image";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "Lancerix — Independent Code Verification";

/**
 * Overrides src/app/opengraph-image.tsx for every route under /en -- Next
 * resolves the file-convention image from the closest matching segment, so
 * this is the only change needed to make English pages share an English
 * card instead of the Turkish default.
 */
export default function Image() {
  return new ImageResponse(renderOgImage("Independent Code Verification"), size);
}
