import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // Existing data-loading effects intentionally update local loading state.
      // Keep this advisory React Compiler rule from blocking the lint command.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['lib/api.ts', 'test/**/*.ts', 'test/**/*.tsx'],
    rules: {
      // The legacy compatibility API and old test fixtures retain their
      // provider-shaped any values; the production server boundary is typed.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
  ]),
])
