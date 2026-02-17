import type { StorybookConfig } from '@storybook/react-vite'
import { resolve } from 'path'

const config: StorybookConfig = {
  // Discover all stories inside src/
  stories: ['../src/**/*.stories.@(ts|tsx)'],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',   // docs, controls, actions, viewport, backgrounds
    '@storybook/addon-interactions', // interaction testing
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  // Pass Vite config to resolve path aliases from tsconfig
  viteFinal(config) {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, '../src'),
    }
    return config
  },

  docs: {
    autodocs: 'tag',
  },

  // Storybook build output
  staticDirs: [],
}

export default config
