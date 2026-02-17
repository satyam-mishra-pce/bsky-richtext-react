/**
 * Default classNames for bsky-richtext-react components.
 *
 * These are Tailwind CSS utility classes applied when no override is provided.
 * Consumers can extend or replace them using `generateClassNames()` and the
 * `classNames` prop on each component.
 *
 * Because these are plain utility classes, no separate stylesheet needs to be
 * imported — as long as Tailwind is configured in the consumer's project, all
 * styles are applied automatically.
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

import type { DisplayClassNames, EditorClassNames, SuggestionClassNames } from '../types/classNames'

// ─── Display ─────────────────────────────────────────────────────────────────

export const defaultDisplayClassNames: DisplayClassNames = {
  root: 'inline break-words',
  mention: 'inline text-blue-500 hover:underline cursor-pointer',
  link: 'inline text-blue-500 hover:underline',
  tag: 'inline text-blue-500 hover:underline cursor-pointer',
}

// ─── Suggestion ──────────────────────────────────────────────────────────────

export const defaultSuggestionClassNames: SuggestionClassNames = {
  root: 'flex flex-col max-h-80 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 min-w-60',
  item: 'flex items-center gap-3 w-full px-3 py-2 text-left cursor-pointer border-none bg-transparent hover:bg-gray-100 select-none',
  itemSelected: 'bg-gray-100',
  avatar:
    'flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center',
  avatarImg: 'block w-full h-full object-cover',
  avatarPlaceholder:
    'flex items-center justify-center w-full h-full text-gray-500 font-medium text-sm',
  text: 'flex flex-col flex-1 min-w-0 overflow-hidden',
  name: 'block truncate font-medium text-gray-900 text-sm',
  handle: 'block truncate text-xs text-gray-500',
  empty: 'block px-3 py-2 text-sm text-gray-500',
}

// ─── Editor ──────────────────────────────────────────────────────────────────

export const defaultEditorClassNames: EditorClassNames = {
  root: 'block w-full relative',
  content: 'block w-full',
  mention: 'inline text-blue-500',
  link: 'inline text-blue-500',
  suggestion: defaultSuggestionClassNames,
}
