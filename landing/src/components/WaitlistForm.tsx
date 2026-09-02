"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Check } from "lucide-react";
import { useMotion } from "@/components/motion/MotionProvider";
import { Stamp } from "@/components/doc/primitives";
import { stampCtaClass } from "@/components/ui/stamp-cta";
import type { Dictionary, Locale } from "@/content";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type Role = "candidate" | "employer";
type Status = "idle" | "submitting" | "success";
type ErrorKey = "errorRequired" | "errorEmail" | "errorGeneric";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** A form input drawn as the document's dotted fill-in line. */
const fillInputClass =
  "min-h-11 w-full rounded-[2px] border-0 border-b border-dotted border-ink-faint bg-transparent px-0 text-[0.9375rem] leading-snug font-medium text-ink placeholder:text-ink-faint focus:border-solid focus:border-brand-600 focus:outline-none";

const fieldRowClass =
  "grid grid-cols-[6.5rem_1fr] items-baseline gap-3 py-2 sm:grid-cols-[7.5rem_1fr]";

/**
 * The closing sheet's signature block: the visitor fills the file in and
 * the office stamps it. Role preselection listens for clicks on any
 * `[data-waitlist-role]` CTA (the anchors keep their #qosul target) and
 * for direct `#qosul-candidate` / `#qosul-employer` deep links.
 */
export function WaitlistForm({
  form,
  locale,
}: {
  form: Dictionary["closing"]["form"];
  locale: Locale;
}) {
  const { motionOK } = useMotion();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("candidate");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<ErrorKey | null>(null);
  const mountedAt = useRef(0);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  // Role preselection: CTAs elsewhere on the page carry data-waitlist-role,
  // and a shared hash suffix supports direct links into either half.
  useEffect(() => {
    const applyFromUrl = () => {
      const hash = window.location.hash;
      if (hash === "#qosul-employer") setRole("employer");
      else if (hash === "#qosul-candidate") setRole("candidate");
    };
    applyFromUrl();
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const value = target
        .closest("[data-waitlist-role]")
        ?.getAttribute("data-waitlist-role");
      if (value === "candidate" || value === "employer") setRole(value);
    };
    window.addEventListener("hashchange", applyFromUrl);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("hashchange", applyFromUrl);
      document.removeEventListener("click", onClick);
    };
  }, []);

  // The stamp lands the moment the office accepts the signature —
  // same arrival as the match sequence's stamp; static under reduced motion.
  useGSAP(
    () => {
      if (status !== "success" || !motionOK) return;
      gsap.from("[data-waitlist-stamp]", {
        scale: 1.8,
        opacity: 0,
        duration: 0.5,
        ease: "back.out(1.6)",
      });
    },
    { scope: successRef, dependencies: [status, motionOK] },
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || trimmedName.length > 120) {
      setError("errorRequired");
      return;
    }
    if (!trimmedEmail) {
      setError("errorRequired");
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("errorEmail");
      return;
    }
    if (!consent) {
      setError("errorRequired");
      return;
    }

    setError(null);
    setStatus("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          role,
          locale,
          consent,
          website,
          elapsedMs: Math.round(performance.now() - mountedAt.current),
        }),
      });
      const data: unknown = await res.json().catch(() => null);
      const ok =
        typeof data === "object" &&
        data !== null &&
        (data as { ok?: unknown }).ok === true;
      if (ok) {
        setStatus("success");
        trackEvent("waitlist_signup", { role, locale });
        return;
      }
      setStatus("idle");
      const errorKind =
        typeof data === "object" && data !== null
          ? (data as { error?: unknown }).error
          : undefined;
      setError(errorKind === "validation" ? "errorEmail" : "errorGeneric");
    } catch {
      setStatus("idle");
      setError("errorGeneric");
    }
  }

  if (status === "success") {
    return (
      <div
        ref={successRef}
        className="mt-10 flex flex-col items-start gap-5 border-t border-ink/50 pt-8"
      >
        <span data-waitlist-stamp className="inline-block">
          <Stamp>{form.successStamp}</Stamp>
        </span>
        <p role="status" className="doc-note max-w-[54ch] text-ink-soft">
          {form.successNote}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-10 border-t border-ink/50 pt-8"
    >
      {/* honeypot — invisible to people, irresistible to bots */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="waitlist-website">Website</label>
        <input
          id="waitlist-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <div className="flex flex-col">
        <div className={fieldRowClass}>
          <label htmlFor="waitlist-name" className="doc-label-sm text-ink-soft">
            {form.nameLabel}
          </label>
          <input
            id="waitlist-name"
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={form.namePlaceholder}
            aria-invalid={
              error === "errorRequired" && !name.trim() ? true : undefined
            }
            className={fillInputClass}
          />
        </div>

        <div className={fieldRowClass}>
          <label htmlFor="waitlist-email" className="doc-label-sm text-ink-soft">
            {form.emailLabel}
          </label>
          <input
            id="waitlist-email"
            name="email"
            type="email"
            required
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={form.emailPlaceholder}
            aria-invalid={
              error === "errorEmail" || (error === "errorRequired" && !email.trim())
                ? true
                : undefined
            }
            className={fillInputClass}
          />
        </div>

        <div className="grid grid-cols-[6.5rem_1fr] items-center gap-3 py-2 sm:grid-cols-[7.5rem_1fr]">
          <span id="waitlist-role-label" className="doc-label-sm text-ink-soft">
            {form.roleLabel}
          </span>
          <div
            role="radiogroup"
            aria-labelledby="waitlist-role-label"
            className="flex flex-wrap items-center gap-2"
          >
            {(["candidate", "employer"] as const).map((option) => (
              <label key={option} className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value={option}
                  checked={role === option}
                  onChange={() => setRole(option)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "doc-label-sm flex min-h-11 items-center rounded-[2px] border px-4 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600",
                    role === option
                      ? "border-carbon-700 bg-carbon-600/10 text-carbon-800"
                      : "border-sheet-line text-ink-soft hover:bg-sheet-shade",
                  )}
                >
                  {option === "candidate"
                    ? form.roleCandidate
                    : form.roleEmployer}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <label className="rule-b mt-2 flex min-h-11 cursor-pointer items-start gap-3 py-3">
        <input
          type="checkbox"
          name="consent"
          required
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          aria-invalid={
            error === "errorRequired" && !consent ? true : undefined
          }
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "mt-1 flex size-4.5 shrink-0 items-center justify-center rounded-[2px] border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600",
            consent
              ? "border-carbon-700 bg-carbon-600"
              : "border-ink-faint bg-transparent",
          )}
        >
          <Check
            strokeWidth={3}
            className={cn(
              "size-3.5 text-cover-950",
              consent ? "opacity-100" : "opacity-0",
            )}
          />
        </span>
        <span className="text-[0.9375rem] leading-relaxed text-ink-soft">
          {form.consentLabel}
        </span>
      </label>

      <div className="mt-7 flex flex-col gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className={cn(
            stampCtaClass,
            "cursor-pointer self-start disabled:pointer-events-none disabled:opacity-45",
          )}
        >
          {status === "submitting" ? form.submitting : form.submit}
        </button>
        {/* reserved-height status line — nothing shifts when an error lands */}
        <p
          role="status"
          className={cn(
            "doc-note min-h-[1.4rem] text-brand-600 transition-opacity duration-200",
            error ? "opacity-100" : "opacity-0",
          )}
        >
          {error ? form[error] : " "}
        </p>
      </div>
    </form>
  );
}
