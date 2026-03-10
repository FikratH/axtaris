import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/store/dataStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft } from 'lucide-react-native';

export default function EditCompanyScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const companies = useDataStore((s) => s.companies);
  const updateCompany = useDataStore((s) => s.updateCompany);
  const company = companies[0];

  const [name, setName] = useState(company?.name || '');
  const [industry, setIndustry] = useState(company?.industry || '');
  const [description, setDescription] = useState(company?.description || '');
  const [website, setWebsite] = useState(company?.website || '');
  const [location, setLocation] = useState(company?.location || '');
  const [employeeCount, setEmployeeCount] = useState(company?.employeeCount || '');
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (!name.trim()) { Alert.alert(tr('common.error'), tr('validation.required')); return; }
    setLoading(true);
    setTimeout(() => {
      updateCompany(company.id, {
        name: name.trim(),
        industry: industry.trim(),
        description: description.trim(),
        website: website.trim() || undefined,
        location: location.trim() || undefined,
        employeeCount: employeeCount.trim() || undefined,
      });
      setLoading(false);
      Alert.alert(tr('common.save'), '', [{ text: 'OK', onPress: () => router.back() }]);
    }, 500);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 12, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}>
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>{tr('employer.editCompany')}</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Input label={tr('employer.companyName')} value={name} onChangeText={setName} placeholder="Company LLC" />
          <Input label={tr('employer.industry')} value={industry} onChangeText={setIndustry} placeholder="Technology" />
          <Input label={tr('employer.about')} value={description} onChangeText={setDescription} placeholder="About the company..." multiline numberOfLines={4} style={{ minHeight: 100, textAlignVertical: 'top' }} />
          <Input label={tr('employer.website')} value={website} onChangeText={setWebsite} placeholder="https://company.com" keyboardType="url" autoCapitalize="none" />
          <Input label={tr('candidate.location')} value={location} onChangeText={setLocation} placeholder="Bakı" />
          <Input label={tr('employer.employeeCount')} value={employeeCount} onChangeText={setEmployeeCount} placeholder="100-500" />
        </View>

        <View style={{ marginTop: 16, gap: 10 }}>
          <Button title={tr('common.save')} onPress={handleSave} loading={loading} size="lg" />
          <Button title={tr('common.cancel')} onPress={() => router.back()} variant="ghost" size="md" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  formCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
});
