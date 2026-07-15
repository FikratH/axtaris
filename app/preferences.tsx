import React from 'react';
import { SettingsScreen } from '@/components/settings/SettingsScreen';

// Pushed screen (candidate profile / admin dashboard entry) — shows the back button.
export default function PreferencesScreen() {
  return <SettingsScreen showBackButton />;
}
