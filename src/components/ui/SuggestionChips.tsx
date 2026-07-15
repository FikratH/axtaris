import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';
import { Chip } from '@/components/ui/Chip';

interface SuggestionChipsProps {
  /** Full candidate list (already localized) to draw from. */
  suggestions: string[];
  /** Called with the chosen value. Fill single-value fields, append list fields. */
  onSelect: (value: string) => void;
  /** Current input text — filters the list and hides an exact match. */
  query?: string;
  /** Values to hide (e.g. items already added). */
  exclude?: string[];
  /** Max chips to show. Default 12. */
  max?: number;
  /** Optional heading above the chips. */
  title?: string;
  style?: ViewStyle;
}

const norm = (v: string) => v.trim().toLowerCase();

/**
 * A row of tappable suggestion chips shown under an input. As the user types it
 * narrows to matches (prefix matches first); tapping a chip fills/appends it.
 */
export function SuggestionChips({
  suggestions,
  onSelect,
  query,
  exclude,
  max = 12,
  title,
  style,
}: SuggestionChipsProps) {
  const { colors, typography: t } = useTheme();
  useTranslation();

  const visible = useMemo(() => {
    const q = norm(query ?? '');
    const excluded = new Set((exclude ?? []).map(norm));

    let pool = suggestions.filter((item) => {
      const n = norm(item);
      if (excluded.has(n)) return false;
      if (q && n === q) return false; // already typed exactly
      if (q && !n.includes(q)) return false;
      return true;
    });

    if (q) {
      pool = [...pool].sort((a, b) => {
        const aStarts = norm(a).startsWith(q) ? 0 : 1;
        const bStarts = norm(b).startsWith(q) ? 0 : 1;
        return aStarts - bStarts;
      });
    }

    return pool.slice(0, max);
  }, [suggestions, query, exclude, max]);

  if (visible.length === 0) return null;

  return (
    <View style={[styles.wrap, style]}>
      {title ? (
        <Text style={[{ color: colors.textTertiary, marginBottom: 6 }, t.caption]}>{title}</Text>
      ) : null}
      <View style={styles.chips}>
        {visible.map((item) => (
          <Chip key={item} label={item} onPress={() => onSelect(item)} style={{ marginBottom: 6 }} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
