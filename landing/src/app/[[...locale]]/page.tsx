import { notFound } from "next/navigation";
import { LandingPage } from "@/components/LandingPage";
import { defaultLocale, isLocale, type Locale } from "@/content";

export function generateStaticParams(): { locale: string[] }[] {
  return [{ locale: [] }, { locale: ["en"] }, { locale: ["ru"] }];
}

export const dynamicParams = false;

export default async function Page({
  params,
}: {
  params: Promise<{ locale?: string[] }>;
}) {
  const segments = (await params).locale;
  let locale: Locale = defaultLocale;
  if (segments && segments.length > 0) {
    const first = segments[0];
    if (segments.length > 1 || !isLocale(first) || first === defaultLocale) {
      notFound();
    }
    locale = first;
  }
  return <LandingPage locale={locale} />;
}
