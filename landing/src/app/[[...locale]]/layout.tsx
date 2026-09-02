import type { Metadata, Viewport } from "next";
import { Alumni_Sans, Commissioner, Martian_Mono } from "next/font/google";
import Script from "next/script";
import { site } from "@/config/site";
import {
  defaultLocale,
  getDictionary,
  isLocale,
  localePath,
  type Locale,
} from "@/content";
import { getJsonLd } from "@/lib/schema";
import "../globals.css";

const alumni = Alumni_Sans({
  variable: "--font-alumni",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

const commissioner = Commissioner({
  variable: "--font-commissioner",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
});

const martian = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
});

/*
Direction contract — rendered as an HTML comment as body's first child; see
CONTRACT constant below. Seed 21ff69f5.
*/
const CONTRACT = `
THESIS: The hiring file made beautiful — a career as a document two sides complete and stamp together; refuses the centered-hero, feature-cards, logo-cloud SaaS arrangement.
OWN-WORLD: Deep-navy file covers as page fields; cool typed sheets; carbon-copy teal duplicates; teal rubber stamps; Alumni Sans condensed display, Commissioner text, Martian Mono field labels; ruled fields and fill-in lines, never cards.
STORY: A visitor sees their career as a document meeting the right vacancy, believes matching is explained rather than promised, and signs the file — joining the beta.
FIRST VIEWPORT: Display headline leads (no eyebrow — the craft floor bans it; the file identity lives on the sheet's own header); sub; stamp CTA with countersign beside; right, the candidate sheet over its teal carbon copy; the arrow's routing line crosses behind; beta note beneath.
FORM: The Carbon File (Şəxsi iş), candidate 4 of 7, seed 21ff69f5, code-led.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
`;

function resolveLocale(segments?: string[]): Locale {
  const first = segments?.[0];
  return first && isLocale(first) ? first : defaultLocale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string[] }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const ogLocale =
    locale === "az" ? "az_AZ" : locale === "ru" ? "ru_RU" : "en_US";

  return {
    metadataBase: new URL(site.url),
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: localePath(locale),
      languages: {
        az: "/",
        en: "/en",
        ru: "/ru",
        "x-default": "/",
      },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: ogLocale,
      title: dict.meta.title,
      description: dict.meta.description,
      url: localePath(locale),
      images: [{ url: `/og/${locale}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
      images: [`/og/${locale}`],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#060d1f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string[] }>;
}) {
  const locale = resolveLocale((await params).locale);
  const dict = getDictionary(locale);
  const jsonLd = JSON.stringify(getJsonLd(locale, dict)).replace(
    /</g,
    "\\u003c",
  );

  return (
    <html
      lang={locale}
      className={`${alumni.variable} ${commissioner.variable} ${martian.variable} antialiased`}
    >
      <body>
        <div
          hidden
          aria-hidden
          dangerouslySetInnerHTML={{ __html: `<!--${CONTRACT}-->` }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-E3RQNWY1BX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-E3RQNWY1BX');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
