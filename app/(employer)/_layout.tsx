import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Briefcase, Users, Building2, Settings } from 'lucide-react-native';

export default function EmployerLayout() {
  const { colors, typography: t } = useTheme();
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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="applicant/[id]"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: tr('employer.dashboard'),
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="vacancies"
        options={{
          title: tr('employer.vacancies'),
          tabBarIcon: ({ color }) => <Briefcase size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="applicants"
        options={{
          title: tr('employer.applicants'),
          tabBarIcon: ({ color }) => <Users size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="company"
        options={{
          title: tr('employer.company'),
          tabBarIcon: ({ color }) => <Building2 size={22} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: tr('employer.settings'),
          tabBarIcon: ({ color }) => <Settings size={22} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}
