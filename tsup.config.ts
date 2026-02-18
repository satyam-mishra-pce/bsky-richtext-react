import { defineConfig } from 'tsup'

export default defineConfig({
  // Entry points — JS bundle + the standalone CSS file
  entry: ['src/index.ts'],

  // Output both ESM (for bundlers/modern Node) and CJS (for legacy tooling)
  format: ['esm', 'cjs'],

  // Generate TypeScript declaration files (.d.ts / .d.cts)
  dts: true,

  // Source maps for easier debugging in consuming apps
  sourcemap: true,

  // Clean the dist directory before each build
  clean: true,

  // Split code into chunks when possible (better tree-shaking)
  splitting: true,

  // Keep these external so the consumer's bundler resolves them — this is
  // critical for TipTap / ProseMirror:  bundling multiple copies of
  // prosemirror-view causes the "Cannot read properties of undefined
  // (reading 'localsInner')" crash because DecorationGroup instances from
  // two different module copies are incompatible.
  external: [
    // React — peer dependency
    'react',
    'react-dom',
    // TipTap — all packages must share a single instance with the consumer
    '@tiptap/core',
    '@tiptap/react',
    '@tiptap/pm',
    '@tiptap/suggestion',
    '@tiptap/extension-document',
    '@tiptap/extension-paragraph',
    '@tiptap/extension-text',
    '@tiptap/extension-history',
    '@tiptap/extension-hard-break',
    '@tiptap/extension-placeholder',
    '@tiptap/extension-mention',
    // ProseMirror — same reason; regex covers all prosemirror-* sub-packages
    /^prosemirror-.*/,
    // Other dependencies that must be singleton instances
    '@atproto/api',
    '@floating-ui/dom',
  ],

  // Minify for production builds
  minify: false, // consumers' bundlers will handle this

  // Do not inject styles — the library ships no CSS; Tailwind classes are
  // resolved by the consumer's own Tailwind setup at build time.
  injectStyle: false,

  // Support path aliases matching tsconfig.json
  esbuildOptions(options) {
    options.conditions = ['import']
  },

  // Maintain package.json exports integrity
  treeshake: true,

  // Target modern browsers/Node where consumers need support
  target: 'es2020',
})
