import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],

  test: {
    // Use jsdom to simulate a browser environment
    environment: 'jsdom',

    // Global test APIs without imports (describe, it, expect, etc.)
    globals: true,

    // Run this setup file before each test
    setupFiles: ['./vitest.setup.ts'],

    // Include test files
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Exclude Storybook and build artifacts
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.stories.{ts,tsx}'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
        'src/**/index.ts',
        'src/types/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
