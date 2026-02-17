/**
 * TipTap Mention extension configured for Bluesky @handle autocomplete.
 *
 * Builds on `@tiptap/extension-mention` and provides a plug point for
 * consumers to supply their own suggestion list via `onMentionQuery`.
 */
import { Mention } from '@tiptap/extension-mention'
import type { SuggestionOptions } from '@tiptap/suggestion'
import type { MentionSuggestion } from '../RichTextEditor'

/**
 * Create the configured Mention extension.
 *
 * @param onMentionQuery  Async function the consumer provides to fetch
 *                        suggestions when the user types "@<query>".
 * @param renderSuggestionList  Optional factory for a custom suggestion popup.
 *                              If omitted, no popup is rendered (headless).
 */
export function createBskyMentionExtension(
  onMentionQuery: (query: string) => Promise<MentionSuggestion[]>,
  renderSuggestionList?: SuggestionOptions['render'],
) {
  return Mention.configure({
    HTMLAttributes: {
      class: 'bsky-mention',
      'data-bsky-mention': '',
    },
    // Store the DID as the node's `id` attribute and the handle as `label`
    renderLabel({ options, node }) {
      return `${options.suggestion.char ?? '@'}${(node.attrs.label as string | undefined) ?? (node.attrs.id as string | undefined) ?? ''}`
    },
    suggestion: {
      char: '@',
      allowSpaces: false,
      startOfLine: false,

      // Fetch suggestions from the consumer
      items: async ({ query }) => {
        if (!query) return []
        try {
          return await onMentionQuery(query)
        } catch {
          return []
        }
      },

      // Render the dropdown — consumer can override with renderSuggestionList
      ...(renderSuggestionList !== undefined ? { render: renderSuggestionList } : {}),
    },
  })
}
