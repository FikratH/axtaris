import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { TabBarIcon, tabPressListeners } from '@/components/ui/TabBarIcon';
import { Home, Search, Bookmark, FileText, User } from 'lucide-react-native';

export default function CandidateLayout() {
  const { colors } = useTheme();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenListeners={tabPressListeners}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
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
        name="home"
        options={{
          title: tr('candidate.home'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon focused={focused}>
              <Home size={22} color={color} strokeWidth={focused ? 2.1 : 1.8} />
            </TabBarIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: tr('candidate.search'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon focused={focused}>
              <Search size={22} color={color} strokeWidth={focused ? 2.1 : 1.8} />
            </TabBarIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: tr('candidate.saved'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon focused={focused}>
              <Bookmark size={22} color={color} strokeWidth={focused ? 2.1 : 1.8} />
            </TabBarIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: tr('candidate.applications'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon focused={focused}>
              <FileText size={22} color={color} strokeWidth={focused ? 2.1 : 1.8} />
            </TabBarIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: tr('candidate.profile'),
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon focused={focused}>
              <User size={22} color={color} strokeWidth={focused ? 2.1 : 1.8} />
            </TabBarIcon>
          ),
        }}
      />
    </Tabs>
  );
}
