import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getDictionary, isLocale, locales, type Locale } from "@/content";

export const dynamic = "force-static";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Locale-aware social card — /og/az, /og/en, /og/ru (statically generated). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const raw = (await params).locale;
  const locale: Locale = isLocale(raw) ? raw : "az";
  const dict = getDictionary(locale);

  const fontDir = join(process.cwd(), "src/assets/fonts");
  const [alumni, martian, wordmark] = await Promise.all([
    readFile(join(fontDir, "alumni-700.ttf")),
    readFile(join(fontDir, "martian-400.ttf")),
    readFile(join(process.cwd(), "public/brand/wordmark-dark.png")),
  ]);
  const wordmarkSrc = `data:image/png;base64,${wordmark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#060d1f",
          padding: "64px 72px",
          position: "relative",
        }}
      >
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <path
            d="M -40 700 Q 420 560 760 330 T 1240 20"
            stroke="#3f60a8"
            strokeOpacity="0.5"
            strokeWidth="3"
            fill="none"
          />
        </svg>
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid rgba(63,96,168,0.6)",
            paddingBottom: 20,
            color: "#4dd0e1",
            fontFamily: "Martian",
            fontSize: 22,
            letterSpacing: 3,
          }}
        >
          <span>{dict.hero.fileKicker}</span>
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Alumni",
            fontSize: 104,
            lineHeight: 1,
            color: "#e8edf5",
            maxWidth: 980,
          }}
        >
          {dict.hero.h1}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ display: "flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori renders plain img only */}
            <img src={wordmarkSrc} alt="AxtarIS" width={200} height={50} />
          </div>
          <div
            style={{
              display: "flex",
              color: "#9fb0d4",
              fontFamily: "Martian",
              fontSize: 22,
            }}
          >
            {dict.meta.ogTagline}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Alumni", data: alumni, style: "normal", weight: 700 },
        { name: "Martian", data: martian, style: "normal", weight: 400 },
      ],
    },
  );
}
