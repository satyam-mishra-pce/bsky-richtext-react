/**
 * Default classNames for bsky-richtext-react components.
 *
 * These are the CSS class names used when no override is provided.
 * The companion `styles.css` targets exactly these class names for structural
 * layout rules. Consumers can extend or override them using `generateClassNames()`.
 *
 * @example Keep defaults, override one class
 * ```tsx
 * import { generateClassNames, defaultEditorClassNames } from 'bsky-richtext-react'
 *
 * classNames={generateClassNames([
 *   defaultEditorClassNames,
 *   { root: 'border rounded-lg p-2' },
 * ])}
 * ```
 *
 * @example Completely replace defaults (opt out of all built-in class names)
 * ```tsx
 * classNames={{ root: 'my-editor', mention: 'my-mention' }}
 * ```
 */

import type {
  DisplayClassNames,
  EditorClassNames,
  SuggestionClassNames,
} from '../types/classNames'

// ─── Display ─────────────────────────────────────────────────────────────────

export const defaultDisplayClassNames: DisplayClassNames = {
  root: 'bsky-richtext',
  mention: 'bsky-mention',
  link: 'bsky-link',
  tag: 'bsky-tag',
}

// ─── Suggestion ──────────────────────────────────────────────────────────────

export const defaultSuggestionClassNames: SuggestionClassNames = {
  root: 'bsky-suggestions',
  item: 'bsky-suggestion-item',
  itemSelected: 'bsky-suggestion-item-selected',
  avatar: 'bsky-suggestion-avatar',
  avatarImg: 'bsky-suggestion-avatar-img',
  avatarPlaceholder: 'bsky-suggestion-avatar-placeholder',
  text: 'bsky-suggestion-text',
  name: 'bsky-suggestion-name',
  handle: 'bsky-suggestion-handle',
  empty: 'bsky-suggestion-empty',
}

// ─── Editor ──────────────────────────────────────────────────────────────────

export const defaultEditorClassNames: EditorClassNames = {
  root: 'bsky-editor',
  content: 'bsky-editor-content',
  placeholder: 'bsky-editor-placeholder',
  mention: 'bsky-editor-mention',
  link: 'autolink',
  suggestion: defaultSuggestionClassNames,
}
