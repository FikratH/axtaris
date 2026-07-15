/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Mirror the standard jest-expo transformIgnorePatterns (prefix match, no
  // trailing slash so `expo` also covers `expo-modules-core`) and additionally
  // allow transforming lucide-react-native, which ships untranspiled sources.
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|lucide-react-native))',
    '/node_modules/react-native-reanimated/plugin/',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
