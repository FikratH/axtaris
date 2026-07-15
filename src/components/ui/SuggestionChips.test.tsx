import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import '@/i18n'; // initialize the default i18next instance for useTranslation()
import { ThemeProvider } from '@/theme/ThemeContext';
import { SuggestionChips } from '@/components/ui/SuggestionChips';

// Renders the component behind a sentinel so we can await ThemeProvider mount
// (it returns null until persisted theme mode resolves), then assert synchronously.
async function renderChips(props: React.ComponentProps<typeof SuggestionChips>) {
  const utils = render(
    <ThemeProvider>
      <Text>__ready__</Text>
      <SuggestionChips {...props} />
    </ThemeProvider>
  );
  await utils.findByText('__ready__');
  return utils;
}

// Flatten the rendered tree into an ordered list of visible strings.
function orderedTexts(json: unknown): string[] {
  const out: string[] = [];
  const walk = (node: unknown): void => {
    if (node == null) return;
    if (typeof node === 'string') {
      out.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const children = (node as { children?: unknown }).children;
    if (Array.isArray(children)) children.forEach(walk);
    else if (children != null) walk(children);
  };
  walk(json);
  return out;
}

describe('SuggestionChips', () => {
  it('filters suggestions by query (case-insensitive substring)', async () => {
    const { queryByText } = await renderChips({
      suggestions: ['JavaScript', 'Python', 'Java'],
      query: 'ja',
      onSelect: jest.fn(),
    });
    expect(queryByText('JavaScript')).toBeTruthy();
    expect(queryByText('Java')).toBeTruthy();
    expect(queryByText('Python')).toBeNull();
  });

  it('orders prefix matches before substring matches', async () => {
    const { toJSON } = await renderChips({
      suggestions: ['Advanced Java', 'Java', 'JavaScript'],
      query: 'jav',
      onSelect: jest.fn(),
    });
    const labels = orderedTexts(toJSON()).filter((t) =>
      ['Advanced Java', 'Java', 'JavaScript'].includes(t)
    );
    expect(labels).toEqual(['Java', 'JavaScript', 'Advanced Java']);
  });

  it('keeps selected values visible (highlighted, not hidden)', async () => {
    const { queryByText } = await renderChips({
      suggestions: ['Baku', 'Ganja'],
      selected: ['Ganja'],
      onSelect: jest.fn(),
    });
    expect(queryByText('Baku')).toBeTruthy();
    expect(queryByText('Ganja')).toBeTruthy();
  });

  it('shows an exact query match (no longer suppressed)', async () => {
    const { queryByText } = await renderChips({
      suggestions: ['React'],
      query: 'react',
      onSelect: jest.fn(),
    });
    expect(queryByText('React')).toBeTruthy();
  });

  it('respects the max chip count', async () => {
    const { queryByText } = await renderChips({
      suggestions: ['One', 'Two', 'Three', 'Four'],
      max: 2,
      onSelect: jest.fn(),
    });
    expect(queryByText('One')).toBeTruthy();
    expect(queryByText('Two')).toBeTruthy();
    expect(queryByText('Three')).toBeNull();
    expect(queryByText('Four')).toBeNull();
  });

  it('calls onSelect with the tapped value', async () => {
    const onSelect = jest.fn();
    const { getByText } = await renderChips({
      suggestions: ['Baku'],
      onSelect,
    });
    fireEvent.press(getByText('Baku'));
    expect(onSelect).toHaveBeenCalledWith('Baku');
  });
});
