/**
 * ClassNames type definitions for bsky-richtext-react components.
 *
 * Each interface describes the styleable parts of a component as an optional
 * nested object of CSS class strings. Use `generateClassNames()` to deep-merge
 * multiple classNames objects together (e.g. defaults + your overrides).
 *
 * @example
 * ```tsx
 * import {
 *   generateClassNames,
 *   defaultEditorClassNames,
 * } from 'bsky-richtext-react'
 *
 * <RichTextEditor
 *   classNames={generateClassNames([
 *     defaultEditorClassNames,
 *     { root: 'border rounded-lg p-2', mention: 'text-blue-500' },
 *   ], cn)}
 * />
 * ```
 */

// ─── RichTextDisplay ─────────────────────────────────────────────────────────

/**
 * Styleable parts of the `RichTextDisplay` component.
 */
export interface DisplayClassNames {
  /** Root `<span>` wrapper around all richtext content */
  root?: string
  /** Anchor element wrapping each @mention */
  mention?: string
  /** Anchor element wrapping each link */
  link?: string
  /** Anchor element wrapping each #hashtag */
  tag?: string
}

// ─── MentionSuggestionList ───────────────────────────────────────────────────

/**
 * Styleable parts of the `MentionSuggestionList` dropdown component.
 * Also nested as `suggestion` inside `EditorClassNames`.
 */
export interface SuggestionClassNames {
  /** Outermost container div */
  root?: string
  /** Each suggestion row (`<button>`) */
  item?: string
  /**
   * Class added to the currently highlighted suggestion row.
   * Applied in addition to `item` — not instead of it.
   */
  itemSelected?: string
  /** Avatar wrapper `<span>` */
  avatar?: string
  /** Avatar `<img>` element */
  avatarImg?: string
  /** Initial-letter fallback shown when no avatar URL is available */
  avatarPlaceholder?: string
  /** Text column container (holds display name + handle) */
  text?: string
  /** Display name `<span>` */
  name?: string
  /** `@handle` `<span>` */
  handle?: string
  /** "No results" empty-state message */
  empty?: string
}

// ─── RichTextEditor ──────────────────────────────────────────────────────────

/**
 * Styleable parts of the `RichTextEditor` component.
 */
export interface EditorClassNames {
  /** Root wrapper `<div>` around the editor */
  root?: string
  /** Inner ProseMirror editable `<div>` (via `.ProseMirror`) */
  content?: string
  /** Placeholder text element */
  placeholder?: string
  /** Mention chips rendered inside the editor */
  mention?: string
  /** Autolink decoration spans rendered inside the editor */
  link?: string
  /** Class names forwarded to the nested `MentionSuggestionList` */
  suggestion?: SuggestionClassNames
}
