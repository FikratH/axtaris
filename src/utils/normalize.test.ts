import { normalizeCity, normalizeSkill } from '@/utils/normalize';

describe('normalizeCity', () => {
  it('folds Baku spellings across languages to a single canonical token', () => {
    const canonical = normalizeCity('Baku');
    expect(canonical).toBe('baku');
    expect(normalizeCity('Bakı')).toBe(canonical);
    expect(normalizeCity('Baki')).toBe(canonical);
    expect(normalizeCity('Баку')).toBe(canonical);
    expect(normalizeCity('bakou')).toBe(canonical);
  });

  it('is case-insensitive and trims surrounding whitespace', () => {
    expect(normalizeCity('  BAKU  ')).toBe('baku');
    expect(normalizeCity('bAkI')).toBe('baku');
  });

  it('folds other Azerbaijani cities to canonical tokens', () => {
    expect(normalizeCity('Gəncə')).toBe('ganja');
    expect(normalizeCity('Гянджа')).toBe('ganja');
    expect(normalizeCity('Ganja')).toBe('ganja');

    expect(normalizeCity('Sumqayıt')).toBe('sumqayit');
    expect(normalizeCity('Сумгаит')).toBe('sumqayit');

    expect(normalizeCity('Naxçıvan')).toBe('nakhchivan');
    expect(normalizeCity('Нахчыван')).toBe('nakhchivan');
  });

  it('returns empty string for empty / null / undefined input', () => {
    expect(normalizeCity('')).toBe('');
    expect(normalizeCity(null)).toBe('');
    expect(normalizeCity(undefined)).toBe('');
  });

  it('falls back to a base-normalized token for unknown cities', () => {
    // Not in the alias table — transliterated + lowercased, but preserved.
    expect(normalizeCity('Some City')).toBe('some city');
    expect(normalizeCity('Paris')).toBe('paris');
  });

  it('transliterates Azerbaijani diacritics for unknown cities', () => {
    // ə->e, ç->c, ş->s, ğ->g, ö->o, ü->u, ı->i
    expect(normalizeCity('Çöl')).toBe('col');
  });
});

describe('normalizeSkill', () => {
  it('folds JS aliases to javascript', () => {
    expect(normalizeSkill('JS')).toBe('javascript');
    expect(normalizeSkill('js')).toBe('javascript');
  });

  it('folds React.js and ReactJS to react', () => {
    expect(normalizeSkill('React.js')).toBe('react');
    expect(normalizeSkill('reactjs')).toBe('react');
  });

  it('trims whitespace and lowercases', () => {
    expect(normalizeSkill('  JavaScript  ')).toBe('javascript');
    expect(normalizeSkill('React')).toBe('react');
  });

  it('strips trailing punctuation before alias lookup', () => {
    expect(normalizeSkill('React.')).toBe('react');
    expect(normalizeSkill('Python/')).toBe('python');
  });

  it('folds common technology aliases', () => {
    expect(normalizeSkill('TS')).toBe('typescript');
    expect(normalizeSkill('Node')).toBe('node.js');
    expect(normalizeSkill('nodejs')).toBe('node.js');
    expect(normalizeSkill('C Sharp')).toBe('c#');
    expect(normalizeSkill('csharp')).toBe('c#');
    expect(normalizeSkill('MS Excel')).toBe('excel');
    expect(normalizeSkill('Photoshop')).toBe('adobe photoshop');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeSkill('react   native')).toBe('react native');
  });

  it('returns empty string for empty / null / undefined input', () => {
    expect(normalizeSkill('')).toBe('');
    expect(normalizeSkill(null)).toBe('');
    expect(normalizeSkill(undefined)).toBe('');
  });

  it('passes through unknown skills as a normalized token', () => {
    expect(normalizeSkill('Kubernetes')).toBe('kubernetes');
  });
});
