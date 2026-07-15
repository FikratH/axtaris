/**
 * Taxonomy normalization for matching (ROADMAP #8).
 *
 * "Bakı" (az), "Баку" (ru) and "Baku" (en) are the same city but three raw
 * strings, so naive equality silently breaks location scoring. Same for skills
 * ("JS" vs "JavaScript", "React.js" vs "React"). These helpers fold the common
 * spellings/scripts to a single canonical token so the matcher compares apples
 * to apples across languages.
 */

// Azerbaijani-latin + a few Cyrillic letters → ASCII, so spellings line up.
const CHAR_MAP: Record<string, string> = {
  ə: 'e', ı: 'i', İ: 'i', ç: 'c', ş: 's', ğ: 'g', ö: 'o', ü: 'u',
};

function transliterate(value: string): string {
  return value
    .split('')
    .map((ch) => CHAR_MAP[ch] ?? ch)
    .join('')
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), ''); // strip remaining combining marks
}

function baseNormalize(value: string): string {
  return transliterate(value.trim().toLowerCase()).replace(/\s+/g, ' ').trim();
}

// canonical → every spelling we want to fold into it (az / ru / en / common typos)
const CITY_ALIASES: Record<string, string[]> = {
  baku: ['baku', 'baki', 'bakı', 'баку', 'bakou'],
  ganja: ['ganja', 'gence', 'gəncə', 'гянджа', 'gyandzha'],
  sumqayit: ['sumqayit', 'sumgait', 'sumqayıt', 'сумгаит', 'sumgayit'],
  mingachevir: ['mingachevir', 'mingecevir', 'mingəçevir', 'мингечаур'],
  nakhchivan: ['nakhchivan', 'naxcivan', 'naxçıvan', 'нахчыван', 'нахичевань'],
  lankaran: ['lankaran', 'lənkəran', 'lenkeran', 'ленкорань'],
  shaki: ['shaki', 'sheki', 'şəki', 'шеки'],
  shirvan: ['shirvan', 'şirvan', 'ширван'],
  yevlakh: ['yevlakh', 'yevlax', 'евлах'],
  khirdalan: ['khirdalan', 'xirdalan', 'xırdalan', 'хырдалан'],
  shamakhi: ['shamakhi', 'şamaxı', 'shamakha', 'шемаха'],
  quba: ['quba', 'guba', 'куба', 'губа'],
};

const CITY_LOOKUP: Record<string, string> = Object.entries(CITY_ALIASES).reduce(
  (acc, [canonical, variants]) => {
    variants.forEach((v) => {
      acc[baseNormalize(v)] = canonical;
    });
    return acc;
  },
  {} as Record<string, string>
);

const SKILL_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  reactjs: 'react',
  'react.js': 'react',
  'react native': 'react native',
  'react-native': 'react native',
  node: 'node.js',
  nodejs: 'node.js',
  'node js': 'node.js',
  'c sharp': 'c#',
  csharp: 'c#',
  'ms excel': 'excel',
  'microsoft excel': 'excel',
  'ms word': 'word',
  photoshop: 'adobe photoshop',
  ps: 'adobe photoshop',
};

/** Fold a city spelling (any of az/ru/en) to a single canonical token. */
export function normalizeCity(value?: string | null): string {
  if (!value) return '';
  const base = baseNormalize(value);
  return CITY_LOOKUP[base] ?? base;
}

/** Fold a skill spelling to a canonical token for overlap comparison. */
export function normalizeSkill(value?: string | null): string {
  if (!value) return '';
  const base = baseNormalize(value).replace(/[.\-_/]+$/g, '').trim();
  return SKILL_ALIASES[base] ?? base;
}
