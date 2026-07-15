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
import { ChevronDown, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

export interface SelectFieldOption<T extends string = string> {
  label: string;
  value: T;
  description?: string;
}

interface SelectFieldProps<T extends string = string> {
  label?: string;
  value?: T;
  placeholder?: string;
  options: SelectFieldOption<T>[];
  onChange: (value: T) => void;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
}

export function SelectField<T extends string = string>({
  label,
  value,
  placeholder,
  options,
  onChange,
  error,
  hint,
  containerStyle,
}: SelectFieldProps<T>) {
  const { colors, radius: r, spacing: s, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const [visible, setVisible] = useState(false);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textSecondary, ...t.labelSmall, marginBottom: s.xs + 2 }]}>
          {label}
        </Text>
      ) : null}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setVisible(true)}
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
        <Text
          style={[
            { color: selected ? colors.textPrimary : colors.textTertiary, flex: 1 },
            t.bodyMedium,
          ]}
          numberOfLines={1}
        >
          {selected?.label || placeholder || ''}
        </Text>
        <ChevronDown size={18} color={colors.textTertiary} strokeWidth={2} />
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: s.lg }}>
              {options.map((option, index) => {
                const isSelected = option.value === value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.8}
                    onPress={() => {
                      onChange(option.value);
                      setVisible(false);
                    }}
                    style={[
                      styles.optionRow,
                      {
                        paddingVertical: s.lg,
                        borderBottomWidth: index < options.length - 1 ? 1 : 0,
                        borderBottomColor: colors.divider,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[{ color: colors.textPrimary, ...t.bodyMedium }]}>{option.label}</Text>
                      {option.description ? (
                        <Text style={[{ color: colors.textTertiary, ...t.caption, marginTop: 4 }]}>
                          {option.description}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? <Check size={18} color={colors.primary} strokeWidth={2.5} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  sheet: { maxHeight: '72%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center' },
});
