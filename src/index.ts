/**
 * bsky-richtext-react
 *
 * React components for rendering and editing Bluesky richtext content.
 * Implements the `app.bsky.richtext.facet` AT Protocol lexicon.
 *
 * @example
 * ```tsx
 * import { RichTextDisplay, RichTextEditor } from 'bsky-richtext-react'
 * ```
 */

// ─── Components ──────────────────────────────────────────────────────────────

export { RichTextDisplay } from './components/RichTextDisplay'
export type {
  RichTextDisplayProps,
  MentionProps,
  LinkProps,
  TagProps,
} from './components/RichTextDisplay'

export { RichTextEditor } from './components/RichTextEditor'
export type {
  RichTextEditorProps,
  RichTextEditorRef,
  MentionSuggestion,
} from './components/RichTextEditor'

/**
 * The default mention suggestion list component.
 * Exported so consumers can render it themselves, wrap it, or use it as
 * a reference for building a custom suggestion UI.
 */
export { MentionSuggestionList } from './components/RichTextEditor'
export type {
  MentionSuggestionListProps,
  MentionSuggestionListRef,
} from './components/RichTextEditor'

/**
 * Factory for the default tippy.js suggestion renderer.
 * Useful if you want to compose your own mention extension setup.
 */
export { createDefaultSuggestionRenderer } from './components/RichTextEditor'
export type { DefaultSuggestionRendererOptions } from './components/RichTextEditor'

// ─── Hooks ───────────────────────────────────────────────────────────────────

export { useRichText } from './hooks'

// ─── Utilities ───────────────────────────────────────────────────────────────

export { parseRichText, toShortUrl, isValidUrl } from './utils'

/**
 * Deep-merge multiple classNames objects into one.
 * Pass an optional `cn` utility (e.g. `clsx`, `tailwind-merge`) to control
 * how duplicate string values are combined.
 *
 * @example
 * ```ts
 * import { generateClassNames, defaultEditorClassNames } from 'bsky-richtext-react'
 *
 * classNames={generateClassNames([
 *   defaultEditorClassNames,
 *   { root: 'border rounded-lg', mention: 'text-blue-500' },
 * ], cn)}
 * ```
 */
export { generateClassNames } from './utils'
export type { ClassNameFn } from './utils'

/**
 * Search Bluesky actors via the public unauthenticated API.
 * This is used as the default mention search in `RichTextEditor`.
 * Import it if you need to call it directly or build a custom debounced wrapper.
 */
export { searchBskyActors, createDebouncedSearch } from './utils'

// ─── Default ClassNames ───────────────────────────────────────────────────────

/**
 * Default classNames objects for each component.
 * Pass these as the first element in `generateClassNames([...])` to start
 * from the built-in structural class names and layer your own on top.
 *
 * @example
 * ```ts
 * import { generateClassNames, defaultEditorClassNames } from 'bsky-richtext-react'
 *
 * const myClassNames = generateClassNames([
 *   defaultEditorClassNames,
 *   { root: 'my-editor' },
 * ])
 * ```
 */
export {
  defaultDisplayClassNames,
  defaultEditorClassNames,
  defaultSuggestionClassNames,
} from './defaults'

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
  ByteSlice,
  MentionFeature,
  LinkFeature,
  TagFeature,
  FacetFeature,
  Facet,
  RichTextRecord,
  RichTextSegment,
} from './types'

export { isMentionFeature, isLinkFeature, isTagFeature } from './types'

export type { DisplayClassNames, EditorClassNames, SuggestionClassNames } from './types'
