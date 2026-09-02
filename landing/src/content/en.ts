import type { Dictionary } from "./types";

export const en: Dictionary = {
  meta: {
    title: "AxtarIS — The right job. The right person.",
    description:
      "The premium employment platform for Azerbaijan: job vacancies with explained matching for seekers and talent search for employers — from profile to interview.",
    ogTagline: "The premium employment platform for Azerbaijan",
  },
  a11y: {
    skipToContent: "Skip to main content",
    mainNav: "Main navigation",
    langSwitch: "Language",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    heroPreviewAlt:
      "A sample candidate sheet with its carbon copy travelling to the employer",
    stampAlt: "MATCHED stamp",
  },
  nav: {
    candidates: "Job seekers",
    employers: "Employers",
    how: "How it works",
    join: "Join",
  },
  hero: {
    fileKicker: "PERSONAL EMPLOYMENT FILE",
    h1: "The right job. The right person. One step closer.",
    sub: "The premium employment platform for Azerbaijan. Your profile is a document — we lay it over the right vacancy, and the rest is a conversation.",
    ctaCandidate: "Start your job search",
    ctaEmployer: "Post a vacancy",
    betaNote: "Currently in closed beta — coming soon to the App Store and Google Play.",
    sampleLabel: "SAMPLE",
    sheetTitle: "CANDIDATE SHEET",
    fields: [
      { label: "Full name", value: "Aysel Mammadova" },
      { label: "Position", value: "Sales Representative" },
      { label: "City", value: "Baku" },
      { label: "Skills", value: "Customer service · Sales · Excel" },
    ],
    matchLabel: "Match",
    matchValue: "Sales Manager — 3 criteria matched",
    carbonNote: "COPY · GOES TO THE EMPLOYER",
  },
  match: {
    h2: "Two sides. One document.",
    intro:
      "On AxtarIS, finding a job is not a pile of paperwork — it is a meeting: we lay the candidate's sheet over the employer's form, and the matching lines reveal themselves.",
    steps: [
      {
        title: "The candidate sheet",
        desc: "Profile, skills, experience — filled in once, working on every application.",
      },
      {
        title: "The vacancy form",
        desc: "Requirements line by line: position, city, schedule, salary range.",
      },
      {
        title: "Match and conversation",
        desc: "The matching lines meet, the stamp lands — and the conversation starts right there.",
      },
    ],
    candidateSheetTitle: "CANDIDATE",
    candidateFields: [
      { label: "Position", value: "Sales Representative" },
      { label: "City", value: "Baku" },
      { label: "Experience", value: "3 years" },
      { label: "Skill", value: "Customer service" },
    ],
    vacancySheetTitle: "VACANCY",
    vacancyFields: [
      { label: "Position", value: "Sales Manager" },
      { label: "City", value: "Baku" },
      { label: "Required", value: "2+ years experience" },
      { label: "Required", value: "Customer service" },
    ],
    stamp: "MATCHED",
    chatTitle: "CHAT",
    chatEmployer: "Hello Aysel! Your profile fits our vacancy. Could you come in for an interview tomorrow?",
    chatCandidate: "Hello! Yes, gladly.",
    sampleLabel: "SAMPLE",
  },
  candidate: {
    h2: "Your sheet speaks for you",
    intro:
      "For job seekers, AxtarIS does three things well: finds the right vacancy, explains why you fit, and never hides what happened to your application.",
    features: [
      {
        title: "Precise search",
        desc: "Filters by city, field, schedule and salary range. Save a search — and hear about it the moment a matching vacancy appears.",
      },
      {
        title: "Match explanations",
        desc: "“You're a fit” is not an empty phrase: you see line by line which of your skills meet which requirements.",
      },
      {
        title: "Application tracking",
        desc: "Every application has its own journey, and you see all of it — from the moment it is sent until the answer.",
      },
      {
        title: "CV and profile",
        desc: "Upload a CV or use your profile as a ready-made sheet. Skills, education, certificates — all in one place.",
      },
    ],
    pipelineLabel: "THE APPLICATION'S JOURNEY",
    pipeline: ["Sent", "In review", "Shortlisted", "Answer"],
    cta: "Start your job search",
  },
  employer: {
    h2: "The carbon copy is yours",
    intro:
      "Every candidate sheet has a carbon copy that travels to the employer. Publish the vacancy, manage the pipeline, move to the conversation — all in one place.",
    features: [
      {
        title: "Vacancy publishing",
        desc: "From draft to active, from active to closed — the vacancy's whole life is under your control.",
      },
      {
        title: "Applicant pipeline",
        desc: "Applications in an orderly queue: review, shortlist, decide.",
      },
      {
        title: "Talent search",
        desc: "The vacancy doesn't have to wait: find matching candidates yourself and send invitations.",
      },
      {
        title: "Direct messaging",
        desc: "Write to candidates without leaving the platform — the road to the interview gets shorter.",
      },
    ],
    pipelineLabel: "THE HIRING PIPELINE",
    pipeline: ["Review", "Shortlist", "Interview", "Hired"],
    statsLabel: "ACTIVITY SIGNALS",
    stats: [
      { label: "Views", value: "128" },
      { label: "Applicants", value: "34" },
      { label: "Response rate", value: "82%" },
    ],
    statsNote: "Sample figures — the dashboard shows your vacancy's real numbers.",
    cta: "Post a vacancy",
  },
  ai: {
    h2: "It helps. It doesn't replace.",
    intro:
      "The AxtarIS assistant is an editor standing at your side with a pencil: concrete suggestions for your CV and profile, a cover-letter draft for your application. The last word is always yours.",
    notes: [
      "Show experience with numbers: not “increased sales”, but “increased sales by 20%”.",
      "Move “customer service” up — it is the most requested skill in the vacancies you search for.",
      "Your cover-letter draft is ready — read it in your own words before sending.",
    ],
    boundary: "The assistant suggests — you decide.",
  },
  trust: {
    h2: "Three languages. One market.",
    intro:
      "AxtarIS is built for the Azerbaijani market: Azerbaijani leads, Russian and English are full equals. Salaries in manats, conversations in your language.",
    langDemoLabel: "THE SAME LINE, THREE LANGUAGES",
    langDemo: [
      { locale: "AZ", label: "Vəzifə", value: "Satış meneceri" },
      { locale: "RU", label: "Должность", value: "Менеджер по продажам" },
      { locale: "EN", label: "Position", value: "Sales Manager" },
    ],
    points: [
      {
        title: "Your account is protected",
        desc: "Report, block, moderation — built into the platform from day one.",
      },
      {
        title: "Local market, local language",
        desc: "Vacancies in AZN, communication in the language you choose — written locally, not translated.",
      },
    ],
  },
  faq: {
    h2: "Questions, answered",
    intro: "The most common questions — with short, honest answers.",
    items: [
      {
        q: "What is AxtarIS?",
        a: "AxtarIS is a premium employment platform built for Azerbaijan: a two-sided marketplace that brings job seekers and employers together in one app. A candidate fills in their profile once — position, city, experience, skills, education, and CV live in a single document. The platform lays that document over each vacancy's requirements line by line, shows why a match is a match, and tracks every application from the moment it is sent until the answer arrives. Employers publish vacancies, manage the applicant pipeline, find matching candidates themselves through talent search, send invitations, and message candidates without leaving the platform. AxtarIS works in three languages — Azerbaijani leads, with Russian and English as full equals — and salary information is shown in Azerbaijani manats. The platform is currently in closed beta and will soon be available as a mobile app on the App Store and Google Play.",
      },
      {
        q: "When does it launch?",
        a: "A closed beta is running now. App Store and Google Play releases are coming soon; beta subscribers hear about the launch first — just join with the form at the end of this page.",
      },
      {
        q: "Is AxtarIS free?",
        a: "During the beta, everything is free. After launch, a free starter plan remains for both candidates and employers; extended capabilities come in paid plans.",
      },
      {
        q: "Which languages does it support?",
        a: "Three: Azerbaijani leads, and Russian and English are supported as full equals — written locally, not translated.",
      },
      {
        q: "How is a match determined?",
        a: "The fields of your profile — position, city, experience, skills — are laid against the vacancy's requirements line by line. You see exactly which lines meet: matching is not a black box, it comes with an explanation.",
      },
    ],
  },
  closing: {
    h2: "The signature is yours.",
    intro:
      "The document is ready — two signature lines are empty. Join the beta and be the first to know on launch day.",
    candidateLabel: "CANDIDATE",
    candidateLine: "I'm looking for a job",
    employerLabel: "EMPLOYER",
    employerLine: "I want to post a vacancy",
    signatureLine: "signature",
    directLabel: "Or email directly:",
    stores: [
      { name: "App Store", status: "Coming soon" },
      { name: "Google Play", status: "Coming soon" },
    ],
    form: {
      nameLabel: "Full name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "you@example.com",
      roleLabel: "I am a",
      roleCandidate: "Candidate",
      roleEmployer: "Employer",
      consentLabel: "I agree to be contacted by email about the beta launch.",
      submit: "Join the beta",
      submitting: "Sending…",
      successStamp: "REGISTERED",
      successNote:
        "You're on the list — you'll be the first to know on launch day.",
      errorRequired: "This field is required.",
      errorEmail: "Check the email address.",
      errorGeneric:
        "Something went wrong. Try again, or write to info@axtaris.app.",
    },
  },
  footer: {
    tagline: "The premium employment platform for Azerbaijan",
    navLabel: "Sections",
    contactLabel: "Contact",
    langLabel: "Language",
    copyright: "© 2026 AxtarIS. All rights reserved.",
    legalPrivacy: "Privacy Policy",
    legalTerms: "Terms of Service",
  },
  cookieConsent: {
    message:
      "We use analytics cookies to improve the site. Is that okay with you?",
    privacyLink: "Privacy Policy",
    accept: "Accept",
    decline: "Decline",
  },
};
