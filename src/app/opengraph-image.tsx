import { ImageResponse } from "next/og";

export const alt = "Rotary Club of Gayaza — Service takes root in Gayaza";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#17458F", color: "white" }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 6, color: "#F7A81B", textTransform: "uppercase" }}>Rotary Club of Gayaza · District 9213</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, lineHeight: 1.0, fontWeight: 600 }}>Service takes root</div>
          <div style={{ fontSize: 96, lineHeight: 1.0, fontWeight: 600, color: "#F7A81B" }}>in Gayaza.</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "rgba(255,255,255,.8)" }}>Sundays 5:00 PM · Eriot Recreation Centre · Gayaza, Uganda</div>
      </div>
    ),
    size,
  );
}
