import { ImageResponse } from "next/og";

import { MARK_DOT, MARK_PATH_D } from "@/components/brand/mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d={MARK_PATH_D} stroke="#f8fafc" strokeWidth="2.4" strokeLinecap="butt" />
          <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r + 0.3} fill="#0060ff" />
        </svg>
      </div>
    ),
    size,
  );
}
