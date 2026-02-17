import type { Preview } from '@storybook/react'

// Import structural CSS so stories reflect the real layout
import '../src/styles.css'

const preview: Preview = {
  parameters: {
    // Default story backgrounds
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'gray', value: '#f6f8fa' },
        { name: 'dark', value: '#1c1c1e' },
      ],
    },

    // Default viewport
    viewport: {
      defaultViewport: 'desktop',
    },

    // Controls panel configuration
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },

    // Actions panel
    actions: { argTypesRegex: '^on[A-Z].*' },

    // Docs configuration
    docs: {
      toc: true,
    },
  },
}

export default preview
