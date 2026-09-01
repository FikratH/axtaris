export type Locale = "az" | "en" | "ru";

export const locales: Locale[] = ["az", "en", "ru"];
export const defaultLocale: Locale = "az";

/** One field row on a document sheet */
export interface DocField {
  label: string;
  value: string;
}

export interface Dictionary {
  meta: {
    title: string;
    description: string;
    ogTagline: string;
  };
  a11y: {
    skipToContent: string;
    mainNav: string;
    langSwitch: string;
    openMenu: string;
    closeMenu: string;
    heroPreviewAlt: string;
    stampAlt: string;
  };
  nav: {
    candidates: string;
    employers: string;
    how: string;
    join: string;
  };
  hero: {
    fileKicker: string;
    h1: string;
    sub: string;
    ctaCandidate: string;
    ctaEmployer: string;
    betaNote: string;
    sampleLabel: string;
    sheetTitle: string;
    fields: DocField[];
    matchLabel: string;
    matchValue: string;
    carbonNote: string;
  };
  match: {
    h2: string;
    intro: string;
    steps: { title: string; desc: string }[];
    candidateSheetTitle: string;
    candidateFields: DocField[];
    vacancySheetTitle: string;
    vacancyFields: DocField[];
    stamp: string;
    chatTitle: string;
    chatEmployer: string;
    chatCandidate: string;
    sampleLabel: string;
  };
  candidate: {
    h2: string;
    intro: string;
    features: { title: string; desc: string; extra?: string }[];
    pipelineLabel: string;
    pipeline: string[];
    cta: string;
  };
  employer: {
    h2: string;
    intro: string;
    features: { title: string; desc: string }[];
    pipelineLabel: string;
    pipeline: string[];
    statsLabel: string;
    stats: DocField[];
    statsNote: string;
    cta: string;
  };
  ai: {
    h2: string;
    intro: string;
    notes: string[];
    boundary: string;
  };
  trust: {
    h2: string;
    intro: string;
    langDemoLabel: string;
    langDemo: { locale: string; label: string; value: string }[];
    points: { title: string; desc: string }[];
  };
  faq: {
    h2: string;
    intro: string;
    items: { q: string; a: string }[];
  };
  closing: {
    h2: string;
    intro: string;
    candidateLabel: string;
    candidateLine: string;
    employerLabel: string;
    employerLine: string;
    signatureLine: string;
    directLabel: string;
    stores: { name: string; status: string }[];
    form: {
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      roleLabel: string;
      roleCandidate: string;
      roleEmployer: string;
      consentLabel: string;
      submit: string;
      submitting: string;
      successStamp: string;
      successNote: string;
      errorRequired: string;
      errorEmail: string;
      errorGeneric: string;
    };
  };
  footer: {
    tagline: string;
    navLabel: string;
    contactLabel: string;
    langLabel: string;
    copyright: string;
    legalPrivacy: string;
    legalTerms: string;
  };
}
