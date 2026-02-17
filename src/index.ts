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
