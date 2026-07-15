import React from 'react';
import { SettingsScreen } from '@/components/settings/SettingsScreen';

// Employer Settings tab (bottom-tab root) — unified with the candidate screen,
// no back button since it's a tab root.
export default function EmployerSettingsScreen() {
  return <SettingsScreen showBackButton={false} />;
}
