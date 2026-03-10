import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { VacancyCard } from '@/components/ui/VacancyCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Search, Bell, TrendingUp, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function CandidateHomeScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((st) => st.user);
  const vacancies = useDataStore((s) => s.vacancies);
  const companies = useDataStore((s) => s.companies);
  const profile = useDataStore((s) => s.candidateProfile);
  const toggleSave = useDataStore((s) => s.toggleSaveJob);
  const savedJobIds = useDataStore((s) => s.savedJobIds);

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const completeness = profile.profileCompleteness;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.backgroundSecondary }]}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={isDark ? ['#111827', '#1A2544', '#111827'] : ['#1B2E5A', '#2D4797', '#3755A0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerContent}>
          {/* Top row: greeting + avatar + bell */}
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, t.bodySmall]}>
                {tr('candidate.greeting', { name: firstName })}
              </Text>
              <Text style={[styles.headerTitle, t.headingLarge]}>
                {tr('candidate.recommendedJobs')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              activeOpacity={0.7}
              style={styles.headerIconBtn}
            >
              <Bell size={20} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(candidate)/profile')}
              activeOpacity={0.8}
              style={{ marginLeft: 10 }}
            >
              <Avatar name={user?.fullName} size={40} />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(candidate)/search')}
            style={styles.searchBar}
          >
            <Search size={18} color="rgba(255,255,255,0.5)" strokeWidth={1.8} />
            <Text style={[styles.searchText, t.bodyMedium]}>
              {tr('candidate.searchPlaceholder')}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Profile Completion Banner ── */}
      {completeness < 100 && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(candidate)/profile')}
          style={[styles.completionBanner, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
        >
          <View style={[styles.completionIcon, { backgroundColor: isDark ? 'rgba(91,127,214,0.15)' : '#EEF2FF' }]}>
            <Sparkles size={20} color={colors.primary} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[{ color: colors.textPrimary }, t.labelSmall]}>{tr('candidate.completeProfile')}</Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.border, marginTop: 6 }]}>
              <View style={[styles.progressFill, { width: `${completeness}%`, backgroundColor: colors.primary }]} />
            </View>
          </View>
          <Text style={[{ color: colors.primary, marginLeft: 12 }, t.labelMedium]}>{completeness}%</Text>
        </TouchableOpacity>
      )}

      {/* ── Recommended Jobs ── */}
      <View style={{ marginTop: 20 }}>
        <SectionHeader
          title={tr('candidate.recommendedJobs')}
          actionTitle={tr('common.seeAll')}
          onAction={() => router.push('/(candidate)/search')}
        />
        <FlatList
          data={vacancies.slice(0, 4)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <View style={{ width: width * 0.78 }}>
              <VacancyCard
                vacancy={item}
                onPress={() => router.push({ pathname: '/vacancy/[id]', params: { id: item.id } })}
                onSave={() => toggleSave(item.id)}
                saved={savedJobIds.includes(item.id)}
                compact
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      {/* ── Top Companies ── */}
      <View style={{ marginTop: 24 }}>
        <SectionHeader
          title={tr('candidate.topCompanies')}
          actionTitle={tr('common.seeAll')}
          onAction={() => {}}
        />
        <FlatList
          data={companies}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(candidate)/search')}
              style={[styles.companyCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
            >
              <Avatar name={item.name} size={44} />
              <Text style={[{ color: colors.textPrimary, marginTop: 8, textAlign: 'center' }, t.labelSmall]} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.companyBadge, { backgroundColor: isDark ? 'rgba(52,211,153,0.12)' : '#ECFDF5' }]}>
                <TrendingUp size={10} color={colors.success} strokeWidth={2} />
                <Text style={[{ color: colors.success, marginLeft: 3 }, t.caption]}>{item.vacancyCount}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      {/* ── Recent Jobs ── */}
      <View style={{ marginTop: 24 }}>
        <SectionHeader
          title={tr('candidate.recentJobs')}
          actionTitle={tr('common.seeAll')}
          onAction={() => router.push('/(candidate)/search')}
        />
        <View style={{ paddingHorizontal: 20 }}>
          {vacancies.slice(0, 4).map((vacancy) => (
            <VacancyCard
              key={vacancy.id}
              vacancy={vacancy}
              onPress={() => router.push({ pathname: '/vacancy/[id]', params: { id: vacancy.id } })}
              onSave={() => toggleSave(vacancy.id)}
              saved={savedJobIds.includes(vacancy.id)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.7)',
  },
  headerTitle: {
    color: '#FFFFFF',
    marginTop: 2,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchText: {
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 10,
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  completionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  companyCard: {
    width: 120,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
});
