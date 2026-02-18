/**
 * createSuggestionRenderer
 *
 * Factory that returns a TipTap `SuggestionOptions['render']` function.
 * It uses `@floating-ui/dom` for cursor-anchored positioning and `ReactRenderer`
 * to mount the `MentionSuggestionList` React component into the popup.
 *
 * Heavily inspired by Bluesky's social-app Autocomplete.tsx and the
 * official TipTap mention example:
 * https://tiptap.dev/docs/editor/extensions/nodes/mention#usage
 *
 * This is the default renderer used when the consumer does NOT supply
 * a custom `renderMentionSuggestion` prop to `<RichTextEditor>`.
 */

import { computePosition, flip, offset, shift } from '@floating-ui/dom'
import { ReactRenderer } from '@tiptap/react'
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import type { SuggestionClassNames } from '../../types/classNames'
import {
  MentionSuggestionList,
  type MentionSuggestionListRef,
  type MentionSuggestionListProps,
} from './MentionSuggestionList'
import type { MentionSuggestion } from './RichTextEditor'

// ─── Options ─────────────────────────────────────────────────────────────────

export interface DefaultSuggestionRendererOptions {
  /**
   * Whether to show avatars in the suggestion list.
   * Forwarded to `MentionSuggestionList`.
   * @default true
   */
  showAvatars?: boolean

  /**
   * Text shown when the query returns no results.
   * @default "No results"
   */
  noResultsText?: string

  /**
   * CSS class names for each styleable part of the suggestion dropdown.
   * Forwarded directly to `MentionSuggestionList`.
   */
  classNames?: Partial<SuggestionClassNames>
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create the default TipTap `suggestion.render` factory.
 *
 * The returned function is called once per "suggestion session"
 * (i.e. each time the user types "@" and a popup should open/update/close).
 *
 * It follows the same lifecycle pattern as the Bluesky reference:
 *  - `onStart`  → Mount ReactRenderer, create floating-ui popup
 *  - `onUpdate` → Update props, reposition popup
 *  - `onKeyDown`→ Delegate to the MentionSuggestionList imperative ref
 *  - `onExit`   → Destroy popup and React renderer
 */
export function createDefaultSuggestionRenderer(
  options: DefaultSuggestionRendererOptions = {},
): SuggestionOptions<MentionSuggestion>['render'] {
  return () => {
    let renderer: ReactRenderer<MentionSuggestionListRef, MentionSuggestionListProps> | undefined
    let popup: HTMLDivElement | undefined

    const buildProps = (props: SuggestionProps<MentionSuggestion>): MentionSuggestionListProps => ({
      ...props,
      showAvatars: options.showAvatars ?? true,
      noResultsText: options.noResultsText ?? 'No results',
      ...(options.classNames !== undefined ? { classNames: options.classNames } : {}),
    })

    return {
      onStart(props: SuggestionProps<MentionSuggestion>) {
        renderer = new ReactRenderer(MentionSuggestionList, {
          props: buildProps(props),
          editor: props.editor,
        })

        if (!props.clientRect) return

        const clientRect = props.clientRect

        // Create a wrapper div with fixed positioning (viewport-relative coords
        // from clientRect) and append the ReactRenderer's element into it.
        popup = document.createElement('div')
        popup.style.position = 'fixed'
        popup.style.zIndex = '9999'
        popup.appendChild(renderer.element)
        document.body.appendChild(popup)

        // Create a virtual reference element for @floating-ui/dom.
        const virtualEl = { getBoundingClientRect: () => clientRect?.() ?? new DOMRect() }

        void computePosition(virtualEl, popup, {
          placement: 'bottom-start',
          middleware: [offset(8), flip(), shift({ padding: 8 })],
        }).then(({ x, y }) => {
          if (popup) {
            popup.style.left = `${x}px`
            popup.style.top = `${y}px`
          }
        })
      },

      onUpdate(props: SuggestionProps<MentionSuggestion>) {
        renderer?.updateProps(buildProps(props))

        if (!props.clientRect || !popup) return

        const clientRect = props.clientRect
        const virtualEl = { getBoundingClientRect: () => clientRect?.() ?? new DOMRect() }

        void computePosition(virtualEl, popup, {
          placement: 'bottom-start',
          middleware: [offset(8), flip(), shift({ padding: 8 })],
        }).then(({ x, y }) => {
          if (popup) {
            popup.style.left = `${x}px`
            popup.style.top = `${y}px`
          }
        })
      },

      onKeyDown(props) {
        // Escape dismisses without selecting
        if (props.event.key === 'Escape') {
          if (popup) popup.style.display = 'none'
          return true
        }
        // All other keys delegated to the list component
        return renderer?.ref?.onKeyDown(props) ?? false
      },

      onExit() {
        popup?.remove()
        renderer?.destroy()
        popup = undefined
        renderer = undefined
      },
    }
  }
}
