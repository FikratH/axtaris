import { MotionProvider } from "@/components/motion/MotionProvider";
import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { MatchSequence } from "@/components/sections/MatchSequence";
import { CandidateChapter } from "@/components/sections/CandidateChapter";
import { EmployerChapter } from "@/components/sections/EmployerChapter";
import { AiChapter } from "@/components/sections/AiChapter";
import { TrustChapter } from "@/components/sections/TrustChapter";
import { Closing } from "@/components/sections/Closing";
import { Footer } from "@/components/sections/Footer";
import { getDictionary, type Locale } from "@/content";

export function LandingPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);

  return (
    <MotionProvider>
      <a
        href="#main"
        className="doc-label sr-only z-50 rounded-[2px] bg-carbon-600 px-4 py-3 text-cover-950 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {dict.a11y.skipToContent}
      </a>
      <Nav dict={dict} locale={locale} />
      <main id="main">
        <Hero dict={dict} />
        <MatchSequence dict={dict} />
        <CandidateChapter dict={dict} />
        <EmployerChapter dict={dict} />
        <AiChapter dict={dict} />
        <TrustChapter dict={dict} />
        <Closing dict={dict} />
      </main>
      <Footer dict={dict} locale={locale} />
    </MotionProvider>
  );
}
