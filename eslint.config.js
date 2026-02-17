import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  // ─── Global ignores (applied first) ────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.local/**',
      'storybook-static/**',
      'coverage/**',
      'eslint.config.js',
      'tsup.config.ts',
      'vitest.config.ts',
      'vitest.setup.ts',
      '.storybook/**',
    ],
  },

  // ─── Base rules ─────────────────────────────────────────────────────────────
  js.configs.recommended,

  // ─── TypeScript type-checked rules ──────────────────────────────────────────
  // Use tsconfig.dev.json so tests + stories are included
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...(config.languageOptions?.parserOptions ?? {}),
        project: './tsconfig.dev.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
  })),

  // ─── React + Hooks rules ────────────────────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      // Not needed with the new JSX transform
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },

  // ─── Custom overrides ───────────────────────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Prefer explicit type imports to keep emit clean
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Allow underscore-prefixed unused vars (common pattern)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Warn rather than error on non-null assertions
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Enforce consistent array type notation
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      // Relax dot-notation rule — TipTap node.attrs uses bracket access legitimately
      '@typescript-eslint/dot-notation': 'off',
    },
  },
)
