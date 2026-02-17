/** @type {import('tailwindcss').Config} */
export default {
  // Scan all source files and Storybook configs for class usage.
  // The library itself only needs coverage for its default classNames
  // (defined in src/defaults/classNames.ts); stories exercise them directly.
  content: ['./src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx,js}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
