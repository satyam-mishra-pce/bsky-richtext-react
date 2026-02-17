/**
 * BskyLinkDecorator — stateless URL decoration for the RichTextEditor.
 *
 * Unlike TipTap Marks (which store formatting in the document model), this
 * extension uses a ProseMirror Plugin with a DecorationSet. Decorations are
 * purely visual — they are recalculated from scratch on every document change
 * by re-running the URL regex over the plain text. This means:
 *
 *   - Typing a space after a URL naturally ends the decoration on the next tick
 *   - Editing inside a URL never duplicates characters
 *   - No stale mark state can accumulate in the document
 *
 * This is identical in approach to Bluesky's reference LinkDecorator.ts in
 * social-app/src/view/com/composer/text-input/web/LinkDecorator.ts.
 *
 * The visual class applied is `autolink` (matching Bluesky's reference).
 * Style it via `.bsky-editor .autolink { … }` or the `classNames.link` prop.
 */

import { Extension } from '@tiptap/core'
import type { Node as ProsemirrorNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

// ─── URL Regex ───────────────────────────────────────────────────────────────

/**
 * Matches http/https URLs in plain text.
 * We keep this simple and consistent with @atproto/api's detectFacetsWithoutResolution,
 * so the visual decoration always matches what will become a link facet.
 */
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g

// ─── Decoration helpers ──────────────────────────────────────────────────────

/**
 * Walk every text node in the document, run URL_REGEX over its content,
 * and emit an inline Decoration for each match.
 */
function getDecorations(doc: ProsemirrorNode, linkClass: string): DecorationSet {
  const decorations: Decoration[] = []

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return

    const text = node.text
    // Reset lastIndex before each new text node
    URL_REGEX.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = URL_REGEX.exec(text)) !== null) {
      let uri = match[0]
      const from = pos + match.index
      let to = from + uri.length

      // Strip trailing punctuation (mirrors Bluesky's iterateUris)
      if (/[.,;!?]$/.test(uri)) {
        uri = uri.slice(0, -1)
        to--
      }
      if (/[)]$/.test(uri) && !uri.includes('(')) {
        uri = uri.slice(0, -1)
        to--
      }

      decorations.push(
        Decoration.inline(from, to, {
          class: linkClass,
          'data-autolink': '',
        }),
      )
    }
  })

  return DecorationSet.create(doc, decorations)
}

// ─── Plugin factory ──────────────────────────────────────────────────────────

function createLinkDecoratorPlugin(linkClass: string): Plugin {
  const key = new PluginKey<DecorationSet>('bsky-link-decorator')

  return new Plugin<DecorationSet>({
    key,

    state: {
      init: (_, { doc }) => getDecorations(doc, linkClass),
      apply: (transaction, decorationSet) => {
        if (transaction.docChanged) {
          return getDecorations(transaction.doc, linkClass)
        }
        // If the doc didn't change (e.g. selection change), just map existing
        // decorations to their new positions.
        return decorationSet.map(transaction.mapping, transaction.doc)
      },
    },

    props: {
      decorations(state) {
        return key.getState(state)
      },
    },
  })
}

// ─── TipTap Extension ────────────────────────────────────────────────────────

export interface BskyLinkDecoratorOptions {
  /**
   * CSS class applied to each decorated URL span.
   * Override via the editor's `classNames.link` prop.
   * @default 'autolink'
   */
  linkClass: string
}

export const BskyLinkDecorator = Extension.create<BskyLinkDecoratorOptions>({
  name: 'bskyLinkDecorator',

  addOptions() {
    return {
      linkClass: 'autolink',
    }
  },

  addProseMirrorPlugins() {
    return [createLinkDecoratorPlugin(this.options.linkClass)]
  },
})
