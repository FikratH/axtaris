import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useDataStore } from '@/store/dataStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { ChevronLeft, Plus } from 'lucide-react-native';

export default function EditProfileScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useDataStore((s) => s.candidateProfile);
  const updateProfile = useDataStore((s) => s.updateCandidateProfile);
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState(profile.title || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [location, setLocation] = useState(profile.location || '');
  const [expectedSalary, setExpectedSalary] = useState(profile.expectedSalary?.toString() || '');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl || '');
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      updateProfile({
        title: title.trim(),
        bio: bio.trim(),
        location: location.trim(),
        expectedSalary: expectedSalary ? parseInt(expectedSalary) : undefined,
        skills,
        portfolioUrl: portfolioUrl.trim() || undefined,
        profileCompleteness: Math.min(100, profile.profileCompleteness + 5),
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
          <Text style={[{ color: colors.textPrimary, marginLeft: 12 }, t.headingMedium]}>{tr('candidate.editProfile')}</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Input label={tr('candidate.jobTitle')} value={title} onChangeText={setTitle} placeholder="Senior Frontend Developer" />
          <Input label="Bio" value={bio} onChangeText={setBio} placeholder={tr('candidate.description')} multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          <Input label={tr('candidate.location')} value={location} onChangeText={setLocation} placeholder="Bakı" />
          <Input label={tr('candidate.expectedSalary')} value={expectedSalary} onChangeText={setExpectedSalary} placeholder="3000" keyboardType="numeric" />
          <Input label={tr('candidate.portfolio')} value={portfolioUrl} onChangeText={setPortfolioUrl} placeholder="https://yoursite.com" keyboardType="url" autoCapitalize="none" />

          <Text style={[{ color: colors.textPrimary, marginBottom: 8 }, t.labelSmall]}>{tr('candidate.skills')}</Text>
          <Input
            value={skillInput}
            onChangeText={setSkillInput}
            placeholder={tr('candidate.addSkill')}
            onSubmitEditing={addSkill}
            rightIcon={<Plus size={16} color={colors.primary} strokeWidth={2} />}
            onRightIconPress={addSkill}
          />
          <View style={styles.chipRow}>
            {skills.map((sk) => (
              <Chip key={sk} label={sk} selected onPress={() => setSkills(skills.filter((s) => s !== sk))} style={{ marginBottom: 6 }} />
            ))}
          </View>
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
