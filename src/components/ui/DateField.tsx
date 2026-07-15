import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

interface DateFieldProps {
  label?: string;
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  minimumYear?: number;
  maximumYear?: number;
}

function pad(value: number) {
  return value.toString().padStart(2, '0');
}

function getDayCount(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function formatDisplayValue(value?: string) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}

export function DateField({
  label,
  value,
  placeholder,
  onChange,
  error,
  hint,
  containerStyle,
  minimumYear = 1980,
  maximumYear = new Date().getFullYear() + 5,
}: DateFieldProps) {
  const { colors, radius: r, spacing: s, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const [visible, setVisible] = useState(false);

  const parsedDate = useMemo(() => {
    if (!value) {
      const today = new Date();
      return {
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate(),
      };
    }

    const [year, month, day] = value.split('-').map((item) => Number(item));
    return {
      year: year || new Date().getFullYear(),
      month: month || 1,
      day: day || 1,
    };
  }, [value]);

  const [draftYear, setDraftYear] = useState(parsedDate.year);
  const [draftMonth, setDraftMonth] = useState(parsedDate.month);
  const [draftDay, setDraftDay] = useState(parsedDate.day);

  const years = useMemo(() => {
    const result: number[] = [];
    for (let year = maximumYear; year >= minimumYear; year -= 1) {
      result.push(year);
    }
    return result;
  }, [maximumYear, minimumYear]);

  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const days = Array.from({ length: getDayCount(draftYear, draftMonth) }, (_, index) => index + 1);

  const open = () => {
    setDraftYear(parsedDate.year);
    setDraftMonth(parsedDate.month);
    setDraftDay(parsedDate.day);
    setVisible(true);
  };

  const confirm = () => {
    const safeDay = Math.min(draftDay, getDayCount(draftYear, draftMonth));
    onChange(`${draftYear}-${pad(draftMonth)}-${pad(safeDay)}`);
    setVisible(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary, ...t.labelSmall, marginBottom: s.xs + 2 }]}>
          {label}
        </Text>
      ) : null}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={open}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.error : colors.inputBorder,
            borderRadius: r.md,
            paddingHorizontal: s.lg,
          },
        ]}
      >
        <Text style={[{ color: value ? colors.textPrimary : colors.textTertiary, flex: 1 }, t.bodyMedium]}>
          {value ? formatDisplayValue(value) : placeholder || ''}
        </Text>
        <CalendarDays size={18} color={colors.textTertiary} strokeWidth={2} />
      </TouchableOpacity>
      {error ? (
        <Text style={[styles.metaText, { color: colors.error, ...t.caption }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.metaText, { color: colors.textTertiary, ...t.caption }]}>{hint}</Text>
      ) : null}

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={[styles.overlay, { backgroundColor: colors.surfaceOverlay }]}> 
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderTopLeftRadius: r.xl,
                borderTopRightRadius: r.xl,
                paddingHorizontal: s.xl,
                paddingVertical: s.lg,
              },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={[{ color: colors.textPrimary, ...t.headingSmall }]}>{label || placeholder}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={[{ color: colors.primary, ...t.labelSmall }]}>{tr('common.close')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.columnsRow}>
              <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
                {days.map((day) => (
                  <TouchableOpacity
                    key={`day-${day}`}
                    onPress={() => setDraftDay(day)}
                    style={[
                      styles.valueRow,
                      {
                        backgroundColor: draftDay === day ? colors.primaryLight : 'transparent',
                        borderRadius: r.md,
                      },
                    ]}
                  >
                    <Text style={[{ color: colors.textPrimary, ...t.bodyMedium }]}>{pad(day)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
                {months.map((month) => (
                  <TouchableOpacity
                    key={`month-${month}`}
                    onPress={() => {
                      setDraftMonth(month);
                      setDraftDay((current) => Math.min(current, getDayCount(draftYear, month)));
                    }}
                    style={[
                      styles.valueRow,
                      {
                        backgroundColor: draftMonth === month ? colors.primaryLight : 'transparent',
                        borderRadius: r.md,
                      },
                    ]}
                  >
                    <Text style={[{ color: colors.textPrimary, ...t.bodyMedium }]}>{pad(month)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.column} showsVerticalScrollIndicator={false}>
                {years.map((year) => (
                  <TouchableOpacity
                    key={`year-${year}`}
                    onPress={() => {
                      setDraftYear(year);
                      setDraftDay((current) => Math.min(current, getDayCount(year, draftMonth)));
                    }}
                    style={[
                      styles.valueRow,
                      {
                        backgroundColor: draftYear === year ? colors.primaryLight : 'transparent',
                        borderRadius: r.md,
                      },
                    ]}
                  >
                    <Text style={[{ color: colors.textPrimary, ...t.bodyMedium }]}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={confirm}
              style={[
                styles.confirmButton,
                { backgroundColor: colors.buttonPrimary, borderRadius: r.lg, marginTop: s.lg },
              ]}
            >
              <Text style={[{ color: '#FFFFFF', ...t.labelMedium }]}>{tr('common.confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {},
  trigger: {
    minHeight: 52,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: { marginTop: 4, marginLeft: 2 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '78%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  columnsRow: { flexDirection: 'row', gap: 10 },
  column: { flex: 1, maxHeight: 260 },
  valueRow: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  confirmButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
