import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Alert } from '@/utils/dialog';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { accountService } from '@/services/accountService';
import { Globe, Palette, Bell, HelpCircle, Info, ChevronRight, FileText, ShieldCheck } from 'lucide-react-native';

export default function EmployerSettingsScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((st) => st.user);
  const signOut = useAuthStore((st) => st.signOut);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/role-select');
  };

  const handleDeleteAccount = () => {
    Alert.alert(tr('settings.deleteAccountConfirmTitle'), tr('settings.deleteAccountConfirmMessage'), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('settings.deleteAccount'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(tr('settings.deleteAccountFinalTitle'), tr('settings.deleteAccountFinalMessage'), [
            { text: tr('common.cancel'), style: 'cancel' },
            {
              text: tr('common.confirm'),
              style: 'destructive',
              onPress: () => {
                void (async () => {
                  try {
                    await accountService.deleteAccount();
                    await signOut();
                    router.replace('/auth/role-select');
                    Alert.alert(tr('settings.deleteAccountSuccess'));
                  } catch (error) {
                    Alert.alert(tr('common.error'), error instanceof Error ? error.message : tr('common.error'));
                  }
                })();
              },
            },
          ]);
        },
      },
    ]);
  };

  const menuItems = [
    { Icon: Globe, label: tr('settings.language'), onPress: () => router.push('/preferences' as never) },
    { Icon: Palette, label: tr('settings.theme'), onPress: () => router.push('/preferences' as never) },
    { Icon: Bell, label: tr('settings.notifications'), onPress: () => router.push('/notifications') },
    { Icon: FileText, label: tr('settings.termsOfService'), onPress: () => router.push('/legal/terms' as never) },
    { Icon: ShieldCheck, label: tr('settings.privacyPolicy'), onPress: () => router.push('/legal/privacy' as never) },
    { Icon: HelpCircle, label: tr('settings.help'), onPress: () => Alert.alert(tr('settings.help'), tr('common.comingSoon')) },
    { Icon: Info, label: tr('settings.about'), onPress: () => Alert.alert('AxtarIS', `${tr('settings.version')} 1.0.0\n${tr('common.tagline')}`) },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: s.xl }]}>
        <Text style={[{ color: colors.textPrimary, ...t.headingLarge }]}>
          {tr('settings.title')}
        </Text>
      </View>

      <View style={[styles.profileCard, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
        <Card padding="md">
          <View style={styles.profileRow}>
            <Avatar name={user?.fullName} size={52} />
            <View style={[styles.profileInfo, { marginLeft: s.md }]}>
              <Text style={[{ color: colors.textPrimary, ...t.labelMedium }]}>{user?.fullName}</Text>
              <Text style={[{ color: colors.textSecondary, ...t.bodySmall, marginTop: 2 }]}>{user?.email}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/company/edit' as never)}>
              <Text style={[{ color: colors.primary, ...t.labelSmall }]}>{tr('common.edit')}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      <View style={[styles.menuSection, { paddingHorizontal: s.xl, marginTop: s['2xl'] }]}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.7}
            onPress={item.onPress}
            style={[
              styles.menuItem,
              {
                paddingVertical: s.lg,
                borderBottomWidth: i < menuItems.length - 1 ? 1 : 0,
                borderBottomColor: colors.divider,
              },
            ]}
          >
            <item.Icon size={20} color={colors.textSecondary} strokeWidth={1.8} style={{ marginRight: s.md }} />
            <Text style={[{ color: colors.textPrimary, ...t.bodyMedium, flex: 1 }]}>{item.label}</Text>
            <ChevronRight size={16} color={colors.textTertiary} strokeWidth={1.8} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={[{ paddingHorizontal: s.xl, marginTop: s['4xl'] }]}>
        <Button title={tr('settings.signOut')} onPress={handleSignOut} variant="destructive" size="md" />
      </View>

      <View style={[{ paddingHorizontal: s.xl, marginTop: s.md }]}>
        <Button
          title={tr('settings.deleteAccount')}
          onPress={handleDeleteAccount}
          variant="ghost"
          size="md"
          textStyle={{ color: colors.error }}
        />
      </View>

      <Text style={[styles.version, { color: colors.textTertiary, ...t.caption, marginTop: s['2xl'] }]}>
        {tr('settings.version')} 1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  profileCard: {},
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { flex: 1 },
  menuSection: {},
  menuItem: { flexDirection: 'row', alignItems: 'center' },
  version: { textAlign: 'center' },
});
