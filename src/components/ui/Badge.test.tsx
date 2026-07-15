import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeContext';
import { Badge } from '@/components/ui/Badge';
import { Chip } from '@/components/ui/Chip';

// ThemeProvider renders null until its persisted mode loads from AsyncStorage,
// so every assertion waits for the children to mount via findBy*.
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Badge', () => {
  it('renders its label', async () => {
    const { findByText } = renderWithTheme(<Badge label="Active" />);
    expect(await findByText('Active')).toBeTruthy();
  });

  it('renders across variants without crashing', async () => {
    const variants = ['default', 'success', 'warning', 'error', 'info', 'outline'] as const;
    const { findByText } = renderWithTheme(
      <>
        {variants.map((v) => (
          <Badge key={v} label={v} variant={v} />
        ))}
      </>
    );
    for (const v of variants) {
      expect(await findByText(v)).toBeTruthy();
    }
  });
});

describe('Chip', () => {
  it('renders its label', async () => {
    const { findByText } = renderWithTheme(<Chip label="Baku" />);
    expect(await findByText('Baku')).toBeTruthy();
  });

  it('fires onPress when tapped', async () => {
    const onPress = jest.fn();
    const { findByText } = renderWithTheme(<Chip label="Tap me" onPress={onPress} />);
    const chip = await findByText('Tap me');
    fireEvent.press(chip);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when no handler is provided (disabled)', async () => {
    const onPress = jest.fn();
    const { findByText } = renderWithTheme(<Chip label="Inert" />);
    const chip = await findByText('Inert');
    // Should not throw even though it is disabled; no handler means nothing fires.
    fireEvent.press(chip);
    expect(onPress).not.toHaveBeenCalled();
  });
});
