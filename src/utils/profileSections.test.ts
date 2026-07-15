import {
  createLocalItemId,
  dedupeBy,
  removeListItem,
  upsertListItem,
} from '@/utils/profileSections';

interface Item {
  id: string;
  name?: string;
}

describe('createLocalItemId', () => {
  it('prefixes the id and produces unique values', () => {
    const a = createLocalItemId('edu');
    const b = createLocalItemId('edu');
    expect(a.startsWith('edu-')).toBe(true);
    expect(b.startsWith('edu-')).toBe(true);
    expect(a).not.toBe(b);
  });

  it('honors different prefixes', () => {
    expect(createLocalItemId('exp').startsWith('exp-')).toBe(true);
  });
});

describe('upsertListItem', () => {
  it('prepends a brand-new item', () => {
    const existing: Item[] = [{ id: '1' }, { id: '2' }];
    const result = upsertListItem(existing, { id: '3', name: 'new' });
    expect(result.map((i) => i.id)).toEqual(['3', '1', '2']);
  });

  it('replaces an existing item in place (preserving order)', () => {
    const existing: Item[] = [{ id: '1', name: 'a' }, { id: '2', name: 'b' }];
    const result = upsertListItem(existing, { id: '2', name: 'updated' });
    expect(result.map((i) => i.id)).toEqual(['1', '2']);
    expect(result[1].name).toBe('updated');
  });

  it('does not mutate the original array', () => {
    const existing: Item[] = [{ id: '1' }];
    const result = upsertListItem(existing, { id: '2' });
    expect(existing).toEqual([{ id: '1' }]);
    expect(result).not.toBe(existing);
  });
});

describe('removeListItem', () => {
  it('removes the item with the matching id', () => {
    const items: Item[] = [{ id: '1' }, { id: '2' }, { id: '3' }];
    expect(removeListItem(items, '2').map((i) => i.id)).toEqual(['1', '3']);
  });

  it('returns an equivalent list when the id is absent', () => {
    const items: Item[] = [{ id: '1' }];
    expect(removeListItem(items, 'missing')).toEqual([{ id: '1' }]);
  });

  it('does not mutate the original array', () => {
    const items: Item[] = [{ id: '1' }, { id: '2' }];
    removeListItem(items, '1');
    expect(items.map((i) => i.id)).toEqual(['1', '2']);
  });
});

describe('dedupeBy', () => {
  it('keeps the first occurrence of each key', () => {
    const items = [
      { id: '1', name: 'first' },
      { id: '1', name: 'second' },
      { id: '2', name: 'third' },
    ];
    const result = dedupeBy(items, (i) => i.id);
    expect(result).toEqual([
      { id: '1', name: 'first' },
      { id: '2', name: 'third' },
    ]);
  });

  it('supports arbitrary key functions', () => {
    const result = dedupeBy(['Apple', 'apple', 'Banana'], (s) => s.toLowerCase());
    expect(result).toEqual(['Apple', 'Banana']);
  });

  it('returns an empty array for empty input', () => {
    expect(dedupeBy([], (x: string) => x)).toEqual([]);
  });
});
