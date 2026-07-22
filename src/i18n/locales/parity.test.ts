import az from './az';
import en from './en';
import ru from './ru';

// Collect the full set of key paths, treating arrays/primitives as leaves.
function keyPaths(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }
  return Object.keys(value as Record<string, unknown>).flatMap((k) =>
    keyPaths((value as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k)
  );
}

const azKeys = new Set(keyPaths(az));
const enKeys = new Set(keyPaths(en));
const ruKeys = new Set(keyPaths(ru));

const diff = (a: Set<string>, b: Set<string>) => [...a].filter((k) => !b.has(k)).sort();

describe('i18n locale parity (az is the source of truth)', () => {
  it('en has exactly the same keys as az', () => {
    expect({ missingInEn: diff(azKeys, enKeys), extraInEn: diff(enKeys, azKeys) }).toEqual({
      missingInEn: [],
      extraInEn: [],
    });
  });

  it('ru has exactly the same keys as az', () => {
    expect({ missingInRu: diff(azKeys, ruKeys), extraInRu: diff(ruKeys, azKeys) }).toEqual({
      missingInRu: [],
      extraInRu: [],
    });
  });
});
