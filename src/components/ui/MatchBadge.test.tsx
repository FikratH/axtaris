import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import i18n from '@/i18n';
import { ThemeProvider } from '@/theme/ThemeContext';
import { MatchBadge } from '@/components/ui/MatchBadge';

async function renderBadge(element: React.ReactElement) {
  const utils = render(
    <ThemeProvider>
      <Text>__ready__</Text>
      {element}
    </ThemeProvider>
  );
  await utils.findByText('__ready__');
  return utils;
}

describe('MatchBadge', () => {
  it('renders the localized score label at or above the minimum score', async () => {
    const expected = i18n.t('match.badge', { score: 88 });
    const { queryByText } = await renderBadge(<MatchBadge score={88} />);
    expect(queryByText(expected)).toBeTruthy();
  });

  it('renders nothing below the minimum score', async () => {
    const expected = i18n.t('match.badge', { score: 20 });
    const { queryByText } = await renderBadge(<MatchBadge score={20} />);
    expect(queryByText(expected)).toBeNull();
  });

  it('honors a custom minScore', async () => {
    const expected = i18n.t('match.badge', { score: 55 });
    const { queryByText } = await renderBadge(<MatchBadge score={55} minScore={70} />);
    expect(queryByText(expected)).toBeNull();
  });
});
