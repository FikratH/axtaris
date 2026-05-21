export function createLocalItemId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function upsertListItem<T extends { id: string }>(items: T[], item: T) {
  const index = items.findIndex((entry) => entry.id === item.id);

  if (index === -1) {
    return [item, ...items];
  }

  return items.map((entry) => (entry.id === item.id ? item : entry));
}

export function removeListItem<T extends { id: string }>(items: T[], id: string) {
  return items.filter((entry) => entry.id !== id);
}
