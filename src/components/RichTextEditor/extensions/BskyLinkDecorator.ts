/**
 * TipTap mark extension that decorates URLs in the document.
 *
 * Detects bare URLs as the user types and marks them so they display
 * as styled links inside the editor — without removing the text.
 * On `onChange`, the parent component calls `detectFacetsWithoutResolution`
 * to generate the proper link facets for the final AT Protocol record.
 */
import { Mark, mergeAttributes } from '@tiptap/core'

const URL_REGEX =
  /(?:^|\s)(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi

export const BskyLinkDecorator = Mark.create({
  name: 'bskyLink',

  // Links should not be user-creatable from menus — only auto-detected
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'bsky-link',
        'data-bsky-link': '',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'a[data-bsky-link]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const defaultAttrs = (this.options as { HTMLAttributes: Record<string, unknown> }).HTMLAttributes
    return ['a', mergeAttributes(defaultAttrs, HTMLAttributes), 0]
  },

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (el) => el.getAttribute('href'),
        renderHTML: (attrs: Record<string, unknown>) => ({ href: attrs.href as string }),
      },
    }
  },

  // Auto-detect URLs as the user types using an input rule
  addInputRules() {
    return [
      {
        find: URL_REGEX,
        handler: ({ state, range, match }) => {
          const url = match[1]
          if (!url) return

          const markType = state.schema.marks[this.name]
          if (!markType) return

          const { tr } = state
          tr.addMark(range.from, range.to, markType.create({ href: url }))
        },
      },
    ]
  },
})
