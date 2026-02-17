/**
 * bsky-richtext-react
 *
 * React components for rendering and editing Bluesky richtext content.
 * Implements the `app.bsky.richtext.facet` AT Protocol lexicon.
 *
 * @example
 * ```tsx
 * import { RichTextDisplay, RichTextEditor } from 'bsky-richtext-react'
 * import 'bsky-richtext-react/styles.css'
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
