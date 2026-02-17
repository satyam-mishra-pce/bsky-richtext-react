/**
 * MentionSuggestionList
 *
 * Default built-in mention autocomplete dropdown.
 * Heavily inspired by Bluesky's social-app Autocomplete.tsx.
 *
 * Default classNames apply Tailwind utility classes for a ready-to-use
 * appearance. Override specific parts using the `classNames` prop with
 * `generateClassNames()`.
 *
 * TipTap requires the `render` factory to return lifecycle callbacks
 * ({ onStart, onUpdate, onKeyDown, onExit }). The component itself is mounted
 * via `ReactRenderer` and positioned via `tippy.js` — see createSuggestionRenderer.ts.
 */

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import type { SuggestionClassNames } from '../../types/classNames'
import { defaultSuggestionClassNames } from '../../defaults/classNames'
import { generateClassNames } from '../../utils/classNames'
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

export interface MentionSuggestionListProps extends SuggestionProps<MentionSuggestion> {
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
   * CSS class names for each styleable part of the suggestion dropdown.
   *
   * Use `generateClassNames()` to merge with the built-in defaults:
   * @example
   * ```tsx
   * import { generateClassNames, defaultSuggestionClassNames } from 'bsky-richtext-react'
   *
   * classNames={generateClassNames([
   *   defaultSuggestionClassNames,
   *   { item: 'px-3 py-2', itemSelected: 'bg-blue-50' },
   * ], cn)}
   * ```
   */
  classNames?: Partial<SuggestionClassNames>
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Default mention suggestion dropdown rendered by `RichTextEditor`.
 *
 * Consumers can pass `classNames` to style specific parts, or pass a completely
 * custom `renderMentionSuggestion` factory to the editor to replace this
 * component entirely.
 */
export const MentionSuggestionList = forwardRef<
  MentionSuggestionListRef,
  MentionSuggestionListProps
>(function MentionSuggestionListImpl(
  { items, command, showAvatars = true, noResultsText = 'No results', classNames: classNamesProp },
  ref,
) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Merge provided classNames with defaults.
  // Memoized via JSON.stringify so inline object literals don't recalculate every render.
  const cn = useMemo(
    () => generateClassNames([defaultSuggestionClassNames, classNamesProp]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(classNamesProp)],
  )

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
      className={cn.root}
      // Prevent the editor from losing focus when clicking a suggestion
      onMouseDown={(e) => e.preventDefault()}
    >
      {items.length === 0 ? (
        <div className={cn.empty}>{noResultsText}</div>
      ) : (
        items.map((item, index) => {
          const isSelected = index === selectedIndex
          const itemClass = isSelected
            ? `${cn.item ?? ''} ${cn.itemSelected ?? ''}`.trim()
            : cn.item

          return (
            <button
              key={item.did}
              type="button"
              className={itemClass}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => selectItem(index)}
            >
              {showAvatars && (
                <span className={cn.avatar}>
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt={item.displayName ?? item.handle}
                      className={cn.avatarImg}
                    />
                  ) : (
                    <span className={cn.avatarPlaceholder} aria-hidden="true">
                      {(item.displayName ?? item.handle).charAt(0).toUpperCase()}
                    </span>
                  )}
                </span>
              )}

              <span className={cn.text}>
                {item.displayName && <span className={cn.name}>{item.displayName}</span>}
                <span className={cn.handle}>@{item.handle}</span>
              </span>
            </button>
          )
        })
      )}
    </div>
  )
})
