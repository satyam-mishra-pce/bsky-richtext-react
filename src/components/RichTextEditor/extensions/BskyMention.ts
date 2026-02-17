/**
 * TipTap Mention extension configured for Bluesky @handle autocomplete.
 *
 * Builds on `@tiptap/extension-mention` and wires up:
 *  - Consumer-supplied `onMentionQuery` for fetching suggestions
 *  - Default popup renderer (tippy.js + MentionSuggestionList) when no
 *    custom `renderMentionSuggestion` is provided
 *
 * Heavily inspired by Bluesky's social-app TextInput.web.tsx and Autocomplete.tsx.
 */
import { Mention } from '@tiptap/extension-mention'
import type { SuggestionOptions } from '@tiptap/suggestion'
import type { MentionSuggestion } from '../RichTextEditor'
import {
  createDefaultSuggestionRenderer,
  type DefaultSuggestionRendererOptions,
} from '../createSuggestionRenderer'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BskyMentionOptions {
  /**
   * Async function that returns suggestions for a given query string.
   * Called every time the user types after "@".
   * Return an empty array to show the "No results" state.
   */
  onMentionQuery: (query: string) => Promise<MentionSuggestion[]>

  /**
   * Custom TipTap `suggestion.render` factory.
   * When provided, replaces the default tippy.js + MentionSuggestionList renderer.
   * When omitted, the built-in renderer is used.
   */
  renderSuggestionList?: SuggestionOptions['render']

  /**
   * Options forwarded to the default renderer (ignored when `renderSuggestionList`
   * is provided).
   */
  defaultRendererOptions?: DefaultSuggestionRendererOptions
}

// ─── Extension factory ───────────────────────────────────────────────────────

/**
 * Create a configured TipTap Mention extension for Bluesky.
 *
 * The mention node stores the account handle as `id` and surfaces it via
 * `renderLabel` as "@handle". When the editor JSON is serialised in
 * `editorJsonToText`, mention nodes are rendered as `@{id}`.
 */
export function createBskyMentionExtension({
  onMentionQuery,
  renderSuggestionList,
  defaultRendererOptions,
}: BskyMentionOptions) {
  // Use the consumer-supplied renderer, or fall back to our built-in one.
  const render =
    renderSuggestionList ?? createDefaultSuggestionRenderer(defaultRendererOptions)

  return Mention.configure({
    HTMLAttributes: {
      class: 'bsky-mention',
      'data-bsky-mention': '',
    },

    /**
     * Render the mention node's text content inside the editor.
     * The `id` attribute stores the handle (e.g. "alice.bsky.social"),
     * so we prefix it with "@".
     *
     * Mirrors the Bluesky reference:
     *   text += `@${json.attrs?.id || ''}`  (in editorJsonToText)
     */
    renderLabel({ options, node }) {
      const handle =
        (node.attrs.label as string | undefined) ??
        (node.attrs.id as string | undefined) ??
        ''
      return `${options.suggestion.char ?? '@'}${handle}`
    },

    suggestion: {
      char: '@',
      allowSpaces: false,
      startOfLine: false,

      /**
       * Fetch suggestion items from the consumer.
       * Matches Bluesky's pattern: `autocomplete({ query })`.
       * Returns up to 8 items (same limit as the reference implementation).
       */
      items: async ({ query }) => {
        if (!query) return []
        try {
          const results = await onMentionQuery(query)
          return results.slice(0, 8)
        } catch {
          return []
        }
      },

      // Spread so the key is only present when defined (exactOptionalPropertyTypes)
      ...(render !== undefined ? { render } : {}),
    },
  })
}
