import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Check, Search, X } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { COUNTRIES, Country, DEFAULT_COUNTRY } from '@/data/countries';

interface PhoneInputProps {
  label?: string;
  value: string; // full phone incl. dial code, e.g. "+994501112233"
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
}

// Longest-dial-first so "+994" wins over "+9".
const BY_DIAL_LENGTH = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

function splitValue(value: string): { country: Country; national: string } {
  const v = (value || '').trim();
  if (v.startsWith('+')) {
    const match = BY_DIAL_LENGTH.find((c) => v.startsWith(c.dial));
    if (match) return { country: match, national: v.slice(match.dial.length).replace(/\D/g, '') };
  }
  return { country: DEFAULT_COUNTRY, national: v.replace(/\D/g, '') };
}

export function PhoneInput({ label, value, onChangeText, error, hint }: PhoneInputProps) {
  const { colors, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();
  const { country, national } = useMemo(() => splitValue(value), [value]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const setCountry = (c: Country) => {
    setPickerOpen(false);
    setQuery('');
    onChangeText(`${c.dial}${national}`);
  };
  const setNational = (n: string) => onChangeText(`${country.dial}${n.replace(/\D/g, '')}`);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  // Basic "number checker": national part must be 7–12 digits.
  const valid = national.length >= 7 && national.length <= 12;
  const shownError = error || (national.length > 0 && !valid ? tr('validation.invalidPhone') : undefined);

  return (
    <View style={{ marginBottom: 16 }}>
      {label ? <Text style={[{ color: colors.textSecondary, marginBottom: 6 }, t.labelSmall]}>{label}</Text> : null}

      <View
        style={[
          styles.row,
          { borderColor: shownError ? colors.error : colors.cardBorder, backgroundColor: colors.surfaceSecondary, borderRadius: r.md },
        ]}
      >
        <TouchableOpacity style={styles.countryBtn} onPress={() => setPickerOpen(true)} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>{country.flag}</Text>
          <Text style={[{ color: colors.textPrimary, marginHorizontal: 4 }, t.bodyMedium]}>{country.dial}</Text>
          <ChevronDown size={16} color={colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <TextInput
          value={national}
          onChangeText={setNational}
          placeholder="50 123 45 67"
          placeholderTextColor={colors.textTertiary}
          keyboardType="phone-pad"
          style={[styles.input, { color: colors.textPrimary }]}
        />
        {national.length > 0 && valid ? <Check size={18} color={colors.success} strokeWidth={2.5} style={{ marginRight: 10 }} /> : null}
      </View>

      {shownError ? (
        <Text style={[{ color: colors.error, marginTop: 4 }, t.caption]}>{shownError}</Text>
      ) : hint ? (
        <Text style={[{ color: colors.textTertiary, marginTop: 4 }, t.caption]}>{hint}</Text>
      ) : null}

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
          <View style={[styles.pickerHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[{ color: colors.textPrimary, flex: 1 }, t.headingSmall]}>{tr('auth.selectCountry')}</Text>
            <TouchableOpacity onPress={() => setPickerOpen(false)} hitSlop={8}>
              <X size={22} color={colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary, borderRadius: r.md }]}>
            <Search size={18} color={colors.textTertiary} strokeWidth={2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={tr('common.search')}
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              autoFocus
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(c) => c.code}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setCountry(item)}
                style={({ pressed }) => [styles.countryRow, { backgroundColor: pressed ? colors.surfaceSecondary : 'transparent', borderBottomColor: colors.divider }]}
              >
                <Text style={{ fontSize: 22 }}>{item.flag}</Text>
                <Text style={[{ color: colors.textPrimary, flex: 1, marginLeft: 12 }, t.bodyMedium]}>{item.name}</Text>
                <Text style={[{ color: colors.textTertiary }, t.bodyMedium]}>{item.dial}</Text>
                {item.code === country.code ? <Check size={18} color={colors.primary} strokeWidth={2.5} style={{ marginLeft: 10 }} /> : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, height: 52 },
  countryBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: '100%' },
  divider: { width: 1, height: '60%' },
  input: { flex: 1, paddingHorizontal: 12, fontSize: 15, height: '100%' },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  searchBox: { flexDirection: 'row', alignItems: 'center', margin: 16, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  countryRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
});
