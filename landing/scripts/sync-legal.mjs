/**
 * Mirrors the canonical legal documents (repo: docs/legal) into
 * src/content/legal so the landing build never depends on files outside
 * its own Vercel root directory.
 *
 * - Runs automatically before every build (npm "prebuild").
 * - When ../docs/legal is present (local dev, full checkout) it re-copies,
 *   so the committed mirror stays fresh.
 * - When it is absent (a Vercel build with "include files outside the root
 *   directory" disabled) it exits quietly and the committed mirror is used.
 *
 * docs/legal is the single source of truth — edit there, never in the mirror.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const landingRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(landingRoot, "..", "docs", "legal");
const target = join(landingRoot, "src", "content", "legal");

if (!existsSync(source)) {
  console.log("[sync-legal] docs/legal not found — using committed mirror.");
  process.exit(0);
}

for (const localeDir of ["en", "az", "ru"]) {
  const from = join(source, localeDir);
  const to = join(target, localeDir);
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(
    `[sync-legal] ${localeDir}: ${readdirSync(to).length} file(s) mirrored.`,
  );
}
