import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, ShieldCheck, Users, Building2, Wallet } from 'lucide-react-native';

export default function AdminLayout() {
  const { colors } = useTheme();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
            },
            android: { elevation: 8 },
          }),
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: tr('admin.dashboard'),
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="moderation"
        options={{
          title: tr('admin.moderation'),
          tabBarIcon: ({ color }) => <ShieldCheck size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: tr('admin.users'),
          tabBarIcon: ({ color }) => <Users size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: tr('admin.companies'),
          tabBarIcon: ({ color }) => <Building2 size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: tr('admin.financeTab'),
          tabBarIcon: ({ color }) => <Wallet size={22} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
