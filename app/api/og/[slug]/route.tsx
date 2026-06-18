import { ImageResponse } from "next/og";

// Edge runtime: @vercel/og's edge asset loader avoids the Node `fileURLToPath`
// font bug that triggers on Windows project paths containing spaces. Edge can't
// touch the filesystem db, so the title/template come in via query params —
// which is exactly what generateMetadata emits.
export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "An interactive explainer").slice(
    0,
    140,
  );
  const template = (searchParams.get("tpl") || "").slice(0, 24);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#0a0810",
          backgroundImage:
            "linear-gradient(135deg, rgba(167,139,250,0.28), rgba(96,165,250,0.08) 45%, rgba(10,8,16,0) 78%)",
          color: "#ECECF1",
        }}
      >
        {/* top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#c4b5fd",
            }}
          >
            Vivid
          </div>
          {template ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 22px",
                borderRadius: "999px",
                border: "1px solid rgba(167,139,250,0.4)",
                backgroundColor: "rgba(167,139,250,0.12)",
                fontSize: 24,
                color: "#d8b4fe",
              }}
            >
              {template} explainer
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
        </div>

        {/* title */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 60 ? 64 : 80,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            maxWidth: "1040px",
          }}
        >
          {title}
        </div>

        {/* bottom row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 28,
            color: "#9aa0b4",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "14px",
              height: "14px",
              borderRadius: "999px",
              backgroundColor: "#a78bfa",
            }}
          />
          Interactive explainer — poke it, then share it.
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
