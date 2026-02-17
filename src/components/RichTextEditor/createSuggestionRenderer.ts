/**
 * createSuggestionRenderer
 *
 * Factory that returns a TipTap `SuggestionOptions['render']` function.
 * It uses `tippy.js` for cursor-anchored positioning and `ReactRenderer`
 * to mount the `MentionSuggestionList` React component into the popup.
 *
 * Heavily inspired by Bluesky's social-app Autocomplete.tsx and the
 * official TipTap mention example:
 * https://tiptap.dev/docs/editor/extensions/nodes/mention#usage
 *
 * This is the default renderer used when the consumer does NOT supply
 * a custom `renderMentionSuggestion` prop to `<RichTextEditor>`.
 */

import type { Instance as TippyInstance } from 'tippy.js'
import tippy from 'tippy.js'
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
 *  - `onStart`  → Mount ReactRenderer, create tippy popup
 *  - `onUpdate` → Update props, reposition popup
 *  - `onKeyDown`→ Delegate to the MentionSuggestionList imperative ref
 *  - `onExit`   → Destroy popup and React renderer
 */
export function createDefaultSuggestionRenderer(
  options: DefaultSuggestionRendererOptions = {},
): SuggestionOptions<MentionSuggestion>['render'] {
  return () => {
    let renderer: ReactRenderer<MentionSuggestionListRef, MentionSuggestionListProps> | undefined
    let popup: TippyInstance[] | undefined

    const destroy = () => {
      popup?.[0]?.destroy()
      renderer?.destroy()
      renderer = undefined
      popup = undefined
    }

    const buildProps = (
      props: SuggestionProps<MentionSuggestion>,
    ): MentionSuggestionListProps => ({
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

        // Create the tippy popup anchored to the cursor position.
        // Matches the Bluesky reference: tippy('body', { ... })
        //
        // We call tippy with a CSS selector string ('body') which uses the
        // MultipleTargets overload and returns Instance[]. The tippy type
        // definitions don't expose a string-selector overload directly, so
        // we cast through unknown to keep things clean.
        //
        // tippy's getReferenceClientRect expects `() => DOMRect | ClientRect`,
        // but TipTap's clientRect can return null — we guard that here.
        const clientRect = props.clientRect
        popup = tippy('body', {
          getReferenceClientRect: () => clientRect?.() ?? new DOMRect(),
          appendTo: () => document.body,
          content: renderer.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        }) as unknown as TippyInstance[]
      },

      onUpdate(props: SuggestionProps<MentionSuggestion>) {
        renderer?.updateProps(buildProps(props))

        if (!props.clientRect) return

        const clientRect = props.clientRect
        popup?.[0]?.setProps({
          getReferenceClientRect: () => clientRect?.() ?? new DOMRect(),
        })
      },

      onKeyDown(props) {
        // Escape dismisses without selecting
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide()
          return true
        }
        // All other keys delegated to the list component
        return renderer?.ref?.onKeyDown(props) ?? false
      },

      onExit() {
        destroy()
      },
    }
  }
}
