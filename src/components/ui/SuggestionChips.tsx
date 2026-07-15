import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { Chip } from '@/components/ui/Chip';

interface SuggestionChipsProps {
  /** Full candidate list (already localized) to draw from. */
  suggestions: string[];
  /** Called with the chosen value. Callers toggle add/remove. */
  onSelect: (value: string) => void;
  /** Current input text — narrows the list (prefix matches first). */
  query?: string;
  /** Values already chosen — rendered highlighted (selected), not hidden. */
  selected?: string[];
  /** Max chips to show. Default 14. */
  max?: number;
  /** Optional heading above the chips. */
  title?: string;
  style?: ViewStyle;
}

const norm = (v: string) => v.trim().toLowerCase();

/**
 * A row of tappable suggestion chips shown under an input. Chosen values render
 * highlighted (and stay visible) so the user sees what's already picked; tapping
 * a chip lets the caller toggle it. As the user types it narrows to matches.
 */
export function SuggestionChips({
  suggestions,
  onSelect,
  query,
  selected,
  max = 14,
  title,
  style,
}: SuggestionChipsProps) {
  const { colors, typography: t } = useTheme();
  useTranslation();

  const selectedSet = useMemo(() => new Set((selected ?? []).map(norm)), [selected]);

  const visible = useMemo(() => {
    const q = norm(query ?? '');

    const pool = suggestions.filter((item) => (q ? norm(item).includes(q) : true));

    // Chosen first (so they're always visible + highlighted), then prefix
    // matches, then the rest.
    const sorted = [...pool].sort((a, b) => {
      const aSel = selectedSet.has(norm(a)) ? 0 : 1;
      const bSel = selectedSet.has(norm(b)) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      if (q) {
        const aStarts = norm(a).startsWith(q) ? 0 : 1;
        const bStarts = norm(b).startsWith(q) ? 0 : 1;
        return aStarts - bStarts;
      }
      return 0;
    });

    return sorted.slice(0, max);
  }, [suggestions, query, selectedSet, max]);

  if (visible.length === 0) return null;

  return (
    <View style={[styles.wrap, style]}>
      {title ? (
        <Text style={[{ color: colors.textTertiary, marginBottom: 6 }, t.caption]}>{title}</Text>
      ) : null}
      <View style={styles.chips}>
        {visible.map((item) => (
          <Chip
            key={item}
            label={item}
            selected={selectedSet.has(norm(item))}
            onPress={() => onSelect(item)}
            style={{ marginBottom: 6 }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
