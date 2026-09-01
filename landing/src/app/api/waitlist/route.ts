/**
 * Waitlist capture endpoint. Validates at the boundary, drops obvious bots
 * silently (honeypot + time gate), rate-limits per IP best-effort, and
 * forwards the signup to Supabase PostgREST with the anon key.
 *
 * Privacy contract: the email is never logged and never echoed back; the
 * anon role has no SELECT, so `Prefer: return=minimal` is mandatory.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ROLES = new Set(["candidate", "employer"]);
const LOCALES = new Set(["az", "en", "ru"]);

const MIN_ELAPSED_MS = 2500;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 5;

/** Best-effort in-memory rate limit (per serverless instance). */
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [key, stamps] of hits) {
      const alive = stamps.filter((t) => now - t < RATE_WINDOW_MS);
      if (alive.length === 0) hits.delete(key);
      else hits.set(key, alive);
    }
  }
  const alive = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (alive.length >= RATE_MAX) {
    hits.set(ip, alive);
    return true;
  }
  alive.push(now);
  hits.set(ip, alive);
  return false;
}

const accepted = () => Response.json({ ok: true });

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ ok: false, error: "generic" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null) throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "validation" }, { status: 400 });
  }

  // Honeypot: a filled "website" field is a bot — pretend success, insert nothing.
  if (typeof body.website === "string" && body.website.length > 0) {
    return accepted();
  }
  // Time gate: instant submissions after form mount are bots — same silent drop.
  if (typeof body.elapsedMs !== "number" || body.elapsedMs < MIN_ELAPSED_MS) {
    return accepted();
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const role = body.role;
  const locale = body.locale;

  if (
    name.length < 1 ||
    name.length > 120 ||
    email.length > 320 ||
    !EMAIL_RE.test(email) ||
    typeof role !== "string" ||
    !ROLES.has(role) ||
    typeof locale !== "string" ||
    !LOCALES.has(locale) ||
    body.consent !== true
  ) {
    return Response.json({ ok: false, error: "validation" }, { status: 400 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return Response.json({ ok: false, error: "generic" }, { status: 502 });
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/waitlist_signups`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name,
        email,
        role,
        locale,
        source: "landing",
        consent: true,
        consent_text_version: "v1",
      }),
      cache: "no-store",
    });
    // 409 = already signed up: idempotent success, prevents email enumeration.
    if (res.ok || res.status === 409) return accepted();
    return Response.json({ ok: false, error: "generic" }, { status: 502 });
  } catch {
    return Response.json({ ok: false, error: "generic" }, { status: 502 });
  }
}
