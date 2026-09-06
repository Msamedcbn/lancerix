import { ImageResponse } from "next/og";

import { MARK_DOT, MARK_PATH_D } from "@/components/brand/mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon -- opaque background, no transparency (iOS ignores
 * alpha and would otherwise show whatever the OS composites underneath). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020618",
        }}
      >
        <svg width="118" height="118" viewBox="0 0 24 24" fill="none">
          <path d={MARK_PATH_D} stroke="#f8fafc" strokeWidth="2" strokeLinecap="butt" />
          <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill="#0060ff" />
        </svg>
      </div>
    ),
    size,
  );
}
