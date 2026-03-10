export const palette = {
  // Primary - Deep Navy (Trust, Authority)
  navy: {
    50: '#E8EDF5',
    100: '#C5D0E6',
    200: '#9FB0D4',
    300: '#7990C2',
    400: '#5C78B5',
    500: '#3F60A8',
    600: '#3755A0',
    700: '#2D4797',
    800: '#233A8E',
    900: '#14257D',
    950: '#0A1628',
  },
  // Accent - Elegant Teal/Cyan
  accent: {
    50: '#E0F7FA',
    100: '#B2EBF2',
    200: '#80DEEA',
    300: '#4DD0E1',
    400: '#26C6DA',
    500: '#00ACC1',
    600: '#0097A7',
    700: '#00838F',
    800: '#006978',
    900: '#004D56',
  },
  // Neutrals
  neutral: {
    0: '#FFFFFF',
    25: '#FAFBFC',
    50: '#F5F7FA',
    100: '#EDF0F5',
    150: '#E4E8EF',
    200: '#D5DAE3',
    300: '#B8BFCC',
    400: '#8F99A8',
    500: '#6B7685',
    600: '#515C6B',
    700: '#3D4654',
    800: '#2A3140',
    900: '#1A2030',
    950: '#111827',
  },
  // Semantic
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
} as const;

export const lightColors = {
  // Backgrounds
  background: palette.neutral[0],
  backgroundSecondary: palette.neutral[25],
  backgroundTertiary: palette.neutral[50],
  surface: palette.neutral[0],
  surfaceSecondary: palette.neutral[50],
  surfaceElevated: palette.neutral[0],
  surfaceOverlay: 'rgba(0, 0, 0, 0.4)',

  // Text
  textPrimary: palette.neutral[950],
  textSecondary: palette.neutral[600],
  textTertiary: palette.neutral[400],
  textInverse: palette.neutral[0],
  textLink: palette.navy[600],

  // Brand
  primary: palette.navy[700],
  primaryLight: palette.navy[50],
  primaryDark: palette.navy[900],
  accent: palette.accent[600],
  accentLight: palette.accent[50],

  // Borders
  border: palette.neutral[200],
  borderLight: palette.neutral[100],
  borderFocus: palette.navy[500],

  // Interactive
  buttonPrimary: palette.navy[700],
  buttonPrimaryPressed: palette.navy[800],
  buttonSecondary: palette.neutral[100],
  buttonSecondaryPressed: palette.neutral[200],
  buttonDestructive: palette.error[600],

  // Status
  success: palette.success[600],
  successLight: palette.success[50],
  warning: palette.warning[600],
  warningLight: palette.warning[50],
  error: palette.error[600],
  errorLight: palette.error[50],
  info: palette.info[600],
  infoLight: palette.info[50],

  // Components
  inputBackground: palette.neutral[0],
  inputBorder: palette.neutral[200],
  cardBackground: palette.neutral[0],
  cardBorder: palette.neutral[100],
  tabBarBackground: palette.neutral[0],
  tabBarBorder: palette.neutral[100],
  tabBarActive: palette.navy[700],
  tabBarInactive: palette.neutral[400],
  skeletonBase: palette.neutral[100],
  skeletonHighlight: palette.neutral[200],
  badge: palette.navy[700],
  chip: palette.neutral[100],
  chipActive: palette.navy[50],
  divider: palette.neutral[100],
  shadow: 'rgba(0, 0, 0, 0.08)',
} as const;

export const darkColors = {
  // Backgrounds
  background: '#0B0F19',
  backgroundSecondary: '#111827',
  backgroundTertiary: '#1A2035',
  surface: '#151B2B',
  surfaceSecondary: '#1E2740',
  surfaceElevated: '#1E2740',
  surfaceOverlay: 'rgba(0, 0, 0, 0.6)',

  // Text
  textPrimary: '#F0F2F5',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: palette.neutral[950],
  textLink: '#7AA2F7',

  // Brand
  primary: '#5B7FD6',
  primaryLight: 'rgba(91, 127, 214, 0.12)',
  primaryDark: '#3F60A8',
  accent: '#22D3EE',
  accentLight: 'rgba(34, 211, 238, 0.12)',

  // Borders
  border: '#2A3448',
  borderLight: '#1E2740',
  borderFocus: '#5B7FD6',

  // Interactive
  buttonPrimary: '#5B7FD6',
  buttonPrimaryPressed: '#4A6EC5',
  buttonSecondary: '#1E2740',
  buttonSecondaryPressed: '#2A3448',
  buttonDestructive: palette.error[500],

  // Status
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.12)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.12)',
  error: '#F87171',
  errorLight: 'rgba(248, 113, 113, 0.12)',
  info: '#60A5FA',
  infoLight: 'rgba(96, 165, 250, 0.12)',

  // Components
  inputBackground: '#151B2B',
  inputBorder: '#2A3448',
  cardBackground: '#151B2B',
  cardBorder: '#1E2740',
  tabBarBackground: '#0B0F19',
  tabBarBorder: '#1E2740',
  tabBarActive: '#7AA2F7',
  tabBarInactive: '#64748B',
  skeletonBase: '#1E2740',
  skeletonHighlight: '#2A3448',
  badge: '#5B7FD6',
  chip: '#1E2740',
  chipActive: 'rgba(91, 127, 214, 0.2)',
  divider: '#1E2740',
  shadow: 'rgba(0, 0, 0, 0.3)',
} as const;

export type ThemeColors = { [K in keyof typeof lightColors]: string };
