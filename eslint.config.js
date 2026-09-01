// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ['dist/*', 'landing/*', '.claude/*', 'src/content/legalContent.generated.ts'],
  },
  {
    // The React-Compiler-era hooks rules flag long-standing (working) patterns
    // and false-positive on Reanimated shared-value writes. Advisory for now —
    // burn down as files are touched; everything else stays enforced.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
]);
