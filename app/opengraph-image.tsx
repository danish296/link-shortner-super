import { ImageResponse } from "next/og";

export const alt = "LinkShort: short links, QR codes and click analytics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#04060a",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#2f55f0",
              color: "#ffffff",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            L
          </div>
          <div style={{ color: "#eef2f9", fontSize: 30, fontWeight: 600 }}>LinkShort</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ color: "#eef2f9", fontSize: 76, fontWeight: 600, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>
            Short links that tell you what happened.
          </div>
          <div style={{ color: "#93a0b8", fontSize: 30, maxWidth: 820 }}>
            Branded URLs, QR codes, bio pages and click analytics in one workspace.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, color: "#93a0b8", fontSize: 22 }}>
          <span>100 links a month free</span>
          <span>·</span>
          <span>REST API</span>
          <span>·</span>
          <span>SVG QR export</span>
        </div>
      </div>
    ),
    size,
  );
}
