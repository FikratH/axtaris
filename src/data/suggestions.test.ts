import { getSuggestions, type SuggestionKey } from '@/data/suggestions';

const KEYS: SuggestionKey[] = [
  'skills',
  'jobTitles',
  'achievements',
  'degrees',
  'fieldsOfStudy',
  'languages',
  'companies',
  'cities',
  'benefits',
  'requirements',
  'responsibilities',
];

const LANGS = ['az', 'ru', 'en'] as const;

describe('getSuggestions', () => {
  it.each(LANGS)('returns a non-empty string array for every key in %s', (lang) => {
    KEYS.forEach((key) => {
      const list = getSuggestions(key, lang);
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
      list.forEach((entry) => {
        expect(typeof entry).toBe('string');
        expect(entry.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it.each(LANGS)('has no duplicate entries within any list for %s', (lang) => {
    KEYS.forEach((key) => {
      const list = getSuggestions(key, lang);
      expect(new Set(list).size).toBe(list.length);
    });
  });

  it('falls back to English for an unknown language', () => {
    KEYS.forEach((key) => {
      // Cast because the accessor only types az/ru/en, but must gracefully fall back.
      const unknown = getSuggestions(key, 'fr' as unknown as 'en');
      expect(unknown).toEqual(getSuggestions(key, 'en'));
    });
  });

  it('returns the same reference/content for a known language', () => {
    const az = getSuggestions('cities', 'az');
    expect(az).toContain('Bakı');
    const en = getSuggestions('cities', 'en');
    expect(en).toContain('Baku');
  });
});
