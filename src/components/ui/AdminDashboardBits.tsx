import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';

/** Small-caps section label with a hairline rule, used to group dashboard tiles. */
export function SectionHeader({ title }: { title: string }) {
  const { colors, typography: t } = useTheme();
  return (
    <View style={styles.sectionRow}>
      <Text style={[t.caption, styles.sectionTitle, { color: colors.textTertiary }]}>{title}</Text>
      <View style={[styles.sectionRule, { backgroundColor: colors.cardBorder }]} />
    </View>
  );
}

interface StatTileProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  onPress?: () => void;
}

/** One KPI tile — same visual language as the original dashboard grid, optionally tappable. */
export function StatTile({ label, value, sub, icon: Icon, color, bg, onPress }: StatTileProps) {
  const { colors, typography: t } = useTheme();
  const body = (
    <>
      <View style={[styles.iconTile, { backgroundColor: bg }]}>
        <Icon size={18} color={color} strokeWidth={1.8} />
      </View>
      <Text style={[{ color: colors.textPrimary, marginTop: 10 }, t.displaySmall]}>{value}</Text>
      <Text
        style={[{ color: colors.textTertiary, marginTop: 2 }, t.caption]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
      {sub ? (
        <Text
          style={[{ color: colors.textSecondary, marginTop: 2 }, t.caption]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {sub}
        </Text>
      ) : null}
    </>
  );

  const cardStyle = [styles.card, { backgroundColor: colors.surface, borderColor: colors.cardBorder }];
  if (!onPress) return <View style={cardStyle}>{body}</View>;
  return (
    <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
      {body}
    </TouchableOpacity>
  );
}

interface BarRowProps {
  label: string;
  total: string;
  values: number[];
  color: string;
}

/** Label + 14-day mini bar chart + total, one metric per row. */
export function MiniBarRow({ label, total, values, color }: BarRowProps) {
  const { colors, typography: t } = useTheme();
  const max = Math.max(1, ...values);
  const barW = 10;
  const gap = 4;
  const h = 30;
  const width = values.length * (barW + gap) - gap;
  return (
    <View style={styles.barRow}>
      <Text style={[t.caption, { color: colors.textSecondary, flex: 1 }]} numberOfLines={2}>
        {label}
      </Text>
      <Svg width={width} height={h}>
        {values.map((v, i) => {
          // Zero-value days keep a 2px floor so the day is visibly present.
          const bh = Math.max(2, Math.round((v / max) * h));
          return (
            <Rect
              key={i}
              x={i * (barW + gap)}
              y={h - bh}
              width={barW}
              height={bh}
              rx={2}
              fill={v > 0 ? color : colors.cardBorder}
            />
          );
        })}
      </Svg>
      <Text style={[t.bodySmall, styles.barTotal, { color: colors.textPrimary }]}>{total}</Text>
    </View>
  );
}

/** Inline label:value chip, used for status breakdowns (funnel, notification types). */
export function CountChip({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  const { typography: t } = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[t.caption, { color, fontWeight: '600' }]}>
        {label} · {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 2, gap: 10 },
  sectionTitle: { textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700' },
  sectionRule: { flex: 1, height: StyleSheet.hairlineWidth },
  card: { width: '47%', flexGrow: 1, padding: 14, borderRadius: 16, borderWidth: 1 },
  iconTile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  barTotal: { fontWeight: '700', minWidth: 34, textAlign: 'right' },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
});
