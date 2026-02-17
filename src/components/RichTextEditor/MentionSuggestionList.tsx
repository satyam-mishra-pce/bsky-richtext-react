/**
 * MentionSuggestionList
 *
 * Default built-in mention autocomplete dropdown.
 * Heavily inspired by Bluesky's social-app Autocomplete.tsx.
 *
 * This is a structural-only component — it ships with layout CSS only.
 * Consumers style it via the data attribute selectors in styles.css,
 * or replace it entirely by passing `renderMentionSuggestion` to the editor.
 *
 * TipTap requires the `render` factory to return lifecycle callbacks
 * ({ onStart, onUpdate, onKeyDown, onExit }). The component itself is mounted
 * via `ReactRenderer` and positioned via `tippy.js` — see createSuggestionRenderer.ts.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import type { MentionSuggestion } from './RichTextEditor'

// ─── Imperative handle ───────────────────────────────────────────────────────

/**
 * Ref handle that TipTap calls into for keyboard events while the popup is open.
 * Mirrors the `MentionListRef` interface from the Bluesky reference implementation.
 */
export interface MentionSuggestionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface MentionSuggestionListProps
  extends SuggestionProps<MentionSuggestion> {
  /**
   * Whether to render avatars when `avatarUrl` is present on a suggestion.
   * When false, avatar placeholder is hidden entirely.
   * @default true
   */
  showAvatars?: boolean

  /**
   * Text to show when the items array is empty.
   * @default "No results"
   */
  noResultsText?: string

  /**
   * Extra CSS class applied to the outermost container.
   */
  className?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Default mention suggestion dropdown rendered by `RichTextEditor`.
 *
 * Consumers can import and render this themselves (wrapped in their own styles),
 * or pass a completely custom `renderMentionSuggestion` factory to the editor.
 *
 * @example Override the no-results text
 * ```tsx
 * // This is handled internally via the default renderer.
 * // To fully customize, pass renderMentionSuggestion to RichTextEditor.
 * ```
 */
export const MentionSuggestionList = forwardRef<
  MentionSuggestionListRef,
  MentionSuggestionListProps
>(function MentionSuggestionListImpl(
  {
    items,
    command,
    showAvatars = true,
    noResultsText = 'No results',
    className,
  },
  ref,
) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Reset selection when items change (new query results arrived)
  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  // ─── Selection helpers ───────────────────────────────────────────────────

  const selectItem = (index: number) => {
    const item = items[index]
    if (item) {
      // `id` is the handle — the editor's `renderLabel` uses it to build "@handle"
      command({ id: item.handle })
    }
  }

  const moveUp = () => {
    setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
  }

  const moveDown = () => {
    setSelectedIndex((prev) => (prev + 1) % items.length)
  }

  // ─── Keyboard handler (called by TipTap via the ref) ────────────────────

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }: SuggestionKeyDownProps): boolean {
      if (event.key === 'ArrowUp') {
        moveUp()
        return true
      }
      if (event.key === 'ArrowDown') {
        moveDown()
        return true
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      data-bsky-mention-suggestions
      className={className}
      // Prevent the editor from losing focus when clicking a suggestion
      onMouseDown={(e) => e.preventDefault()}
    >
      {items.length === 0 ? (
        <div data-bsky-mention-suggestion-empty>{noResultsText}</div>
      ) : (
        items.map((item, index) => {
          const isSelected = index === selectedIndex

          return (
            <button
              key={item.did}
              type="button"
              data-bsky-mention-suggestion-item
              data-selected={isSelected || undefined}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => selectItem(index)}
            >
              {showAvatars && (
                <span data-bsky-mention-avatar>
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt={item.displayName ?? item.handle}
                      data-bsky-mention-avatar-img
                    />
                  ) : (
                    <span data-bsky-mention-avatar-placeholder aria-hidden="true">
                      {(item.displayName ?? item.handle).charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
              )}

              <span data-bsky-mention-suggestion-text>
                {item.displayName && (
                  <span data-bsky-mention-suggestion-name>{item.displayName}</span>
                )}
                <span data-bsky-mention-suggestion-handle>@{item.handle}</span>
              </span>
            </button>
          )
        })
      )}
    </div>
  )
})
