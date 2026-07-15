// Provide an in-memory AsyncStorage so components/providers that persist state
// (e.g. ThemeProvider, i18n) work under Jest without a native module.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
