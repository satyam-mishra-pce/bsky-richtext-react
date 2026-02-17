import { defineConfig } from 'tsup'

export default defineConfig({
  // Entry points — JS bundle + the standalone CSS file
  entry: ['src/index.ts', 'src/styles.css'],

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

  // Keep React external (peer dependency, not bundled)
  external: ['react', 'react-dom'],

  // Minify for production builds
  minify: false, // consumers' bundlers will handle this

  // Bundle CSS separately (users import "./styles.css" manually)
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
