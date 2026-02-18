/**
 * RichTextEditor
 *
 * TipTap-based editor for composing AT Protocol richtext content.
 * Heavily inspired by Bluesky's social-app TextInput.web.tsx.
 *
 * Key differences from the reference implementation:
 *  - No React Native / Expo dependencies — pure React DOM
 *  - No Bluesky-specific theming (ALF) — headless, consumer styles it
 *  - No media paste / emoji picker (out of scope for this library)
 *  - `onChange` emits a plain `RichTextRecord` instead of an `RichText` class
 */

import { useEffect, useImperativeHandle, useMemo, type HTMLAttributes, type Ref } from 'react'
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react'
import { Document } from '@tiptap/extension-document'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { History } from '@tiptap/extension-history'
import { HardBreak } from '@tiptap/extension-hard-break'
import { Placeholder } from '@tiptap/extension-placeholder'
import type { SuggestionOptions } from '@tiptap/suggestion'
import { RichText as AtpRichText } from '@atproto/api'
import type { RichTextRecord, Facet } from '../../types/facets'
import type { EditorClassNames } from '../../types/classNames'
import { defaultEditorClassNames } from '../../defaults/classNames'
import { generateClassNames } from '../../utils/classNames'
import { createDebouncedSearch } from '../../utils/blueskyApi'
import { createBskyMentionExtension } from './extensions/BskyMention'
import { BskyLinkDecorator } from './extensions/BskyLinkDecorator'
import type { DefaultSuggestionRendererOptions } from './createSuggestionRenderer'

// ─── Public Types ────────────────────────────────────────────────────────────

/**
 * A single suggestion item for the @mention autocomplete popup.
 */
export interface MentionSuggestion {
  /** DID of the suggested account — used as the facet's `did` value */
  did: string
  /** Display handle (e.g. "alice.bsky.social") */
  handle: string
  /** Optional display name */
  displayName?: string
  /** Optional avatar URL */
  avatarUrl?: string
}

/**
 * Imperative ref API for `RichTextEditor`.
 */
export interface RichTextEditorRef {
  /** Focus the editor */
  focus: () => void
  /** Blur the editor */
  blur: () => void
  /** Clear the editor content */
  clear: () => void
  /** Get the current plain-text content */
  getText: () => string
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface RichTextEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Initial richtext value. The editor is pre-populated with this content on mount.
   * This is an uncontrolled initial state — use `onChange` to track updates.
   */
  initialValue?: RichTextRecord | string

  /**
   * Called on every content change with the latest `RichTextRecord`.
   *
   * The `facets` array is populated via `detectFacetsWithoutResolution()` —
   * facets will contain handles (not DIDs) for mentions until you resolve them
   * server-side using the AT Protocol agent.
   */
  onChange?: (record: RichTextRecord) => void

  /**
   * Placeholder text shown when the editor is empty.
   */
  placeholder?: string

  /**
   * Called when the editor gains focus.
   */
  onFocus?: () => void

  /**
   * Called when the editor loses focus.
   */
  onBlur?: () => void

  /**
   * Async function to fetch @mention suggestions.
   * Called with the query string (text after "@") as the user types.
   * Return an empty array to show no suggestions / "No results".
   *
   * When not provided, the built-in Bluesky public API search is used
   * (debounced by `mentionSearchDebounceMs`). Set `disableDefaultMentionSearch`
   * to true to disable this default behaviour entirely.
   *
   * @example
   * ```tsx
   * onMentionQuery={async (q) => {
   *   const res = await agent.searchActors({ term: q, limit: 8 })
   *   return res.data.actors.map(a => ({
   *     did: a.did,
   *     handle: a.handle,
   *     displayName: a.displayName,
   *     avatarUrl: a.avatar,
   *   }))
   * }}
   * ```
   */
  onMentionQuery?: (query: string) => Promise<MentionSuggestion[]>

  /**
   * Debounce delay (in milliseconds) applied to the built-in Bluesky mention
   * search. Has no effect when `onMentionQuery` is provided.
   * @default 300
   */
  mentionSearchDebounceMs?: number

  /**
   * When true, disables the default Bluesky public API mention search.
   * No suggestions will appear unless you provide `onMentionQuery`.
   * @default false
   */
  disableDefaultMentionSearch?: boolean

  /**
   * Custom TipTap `suggestion.render` factory.
   * When provided, replaces the default @floating-ui/dom + MentionSuggestionList renderer.
   * The factory must return `{ onStart, onUpdate, onKeyDown, onExit }`.
   *
   * See: https://tiptap.dev/docs/editor/extensions/nodes/mention#usage
   */
  renderMentionSuggestion?: SuggestionOptions['render']

  /**
   * Options forwarded to the default suggestion renderer.
   * Only used when `renderMentionSuggestion` is NOT provided.
   */
  mentionSuggestionOptions?: DefaultSuggestionRendererOptions

  /**
   * CSS class names for each styleable part of the editor.
   *
   * Use `generateClassNames()` to cleanly merge with the built-in defaults:
   * @example
   * ```tsx
   * import { generateClassNames, defaultEditorClassNames } from 'bsky-richtext-react'
   *
   * <RichTextEditor
   *   classNames={generateClassNames([
   *     defaultEditorClassNames,
   *     { root: 'border rounded-lg p-3', mention: 'text-blue-500' },
   *   ], cn)}
   * />
   * ```
   *
   * Or pass a completely custom object to opt out of the defaults:
   * ```tsx
   * <RichTextEditor classNames={{ root: 'my-editor', mention: 'my-mention' }} />
   * ```
   */
  classNames?: Partial<EditorClassNames>

  /**
   * Imperative ref for programmatic control.
   */
  editorRef?: Ref<RichTextEditorRef>

  /**
   * Whether the editor content is editable.
   * @default true
   */
  editable?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a `RichTextRecord` or string to the HTML the editor uses as
 * its initial content.
 *
 * Mention nodes must be expressed as `<span data-type="mention" data-id="handle">`
 * so TipTap's Mention extension can parse them correctly on load.
 *
 * Mirrors `richTextToHTML` in the Bluesky reference implementation.
 */
function toInitialHTML(value: RichTextRecord | string | undefined): string {
  if (!value) return ''

  if (typeof value === 'string') {
    return `<p>${escapeHTML(value)}</p>`
  }

  const { text, facets } = value

  if (!facets?.length) {
    return `<p>${escapeHTML(text)}</p>`
  }

  // Use @atproto/api's RichText class to iterate segments — it handles
  // the byte-offset arithmetic for us.
  // Cast via unknown: our Facet type is structurally identical to @atproto/api's
  // internal Main[] but lacks the index signature that atproto adds.
  // We also guard against undefined since exactOptionalPropertyTypes is enabled.
  const atpFacets = facets as unknown as AtpRichText['facets']
  const rt = new AtpRichText(atpFacets ? { text, facets: atpFacets } : { text })
  let html = ''

  for (const segment of rt.segments()) {
    if (segment.mention) {
      // Mention: emit a TipTap mention node using the DID as the `data-id`.
      // The mention extension will render it via `renderLabel` as "@handle".
      html += `<span data-type="mention" data-id="${escapeHTML(segment.mention.did)}"></span>`
    } else {
      html += escapeHTML(segment.text)
    }
  }

  return html
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Convert the TipTap editor's JSON document to a plain text string.
 *
 * - `doc` nodes iterate their children
 * - `paragraph` nodes add a newline after themselves (except the last one)
 * - `hardBreak` nodes add a newline
 * - `text` nodes emit their text content
 * - `mention` nodes emit "@{id}" (the handle stored in `attrs.id`)
 *
 * Directly mirrors `editorJsonToText` from the Bluesky reference.
 */
function editorJsonToText(json: JSONContent, isLastDocumentChild = false): string {
  let text = ''

  if (json.type === 'doc') {
    if (json.content?.length) {
      for (let i = 0; i < json.content.length; i++) {
        const node = json.content[i]
        if (!node) continue
        const isLast = i === json.content.length - 1
        text += editorJsonToText(node, isLast)
      }
    }
  } else if (json.type === 'paragraph') {
    if (json.content?.length) {
      for (const node of json.content) {
        text += editorJsonToText(node)
      }
    }
    if (!isLastDocumentChild) {
      text += '\n'
    }
  } else if (json.type === 'hardBreak') {
    text += '\n'
  } else if (json.type === 'text') {
    text += json.text ?? ''
  } else if (json.type === 'mention') {
    // The `id` attribute holds the handle chosen during autocomplete
    text += `@${(json.attrs?.id as string | undefined) ?? ''}`
  }

  return text
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `RichTextEditor` is a TipTap-based editor for composing AT Protocol richtext.
 *
 * Features:
 * - Real-time @mention autocomplete — defaults to the Bluesky public API,
 *   override with `onMentionQuery`
 * - Automatic URL decoration (link facets detected on change)
 * - Hard-break (Shift+Enter) for newlines inside a paragraph
 * - Undo/redo history
 * - `onChange` emits a `RichTextRecord` with `text` + `facets` populated via
 *   `detectFacetsWithoutResolution()`
 * - Headless by default — Tailwind utility classes are applied via the default classNames; override freely via the `classNames` prop
 *
 * @example Basic usage (built-in Bluesky mention search)
 * ```tsx
 * <RichTextEditor
 *   placeholder="What's on your mind?"
 *   onChange={(record) => setPost(record)}
 * />
 * ```
 *
 * @example Custom mention search
 * ```tsx
 * <RichTextEditor
 *   placeholder="What's on your mind?"
 *   onMentionQuery={async (q) => searchProfiles(q)}
 *   onChange={(record) => setPost(record)}
 * />
 * ```
 *
 * @example With classNames
 * ```tsx
 * import { generateClassNames, defaultEditorClassNames } from 'bsky-richtext-react'
 *
 * <RichTextEditor
 *   classNames={generateClassNames([
 *     defaultEditorClassNames,
 *     { root: 'border rounded-lg p-3' },
 *   ], cn)}
 * />
 * ```
 */
export function RichTextEditor({
  initialValue,
  onChange,
  placeholder,
  onFocus,
  onBlur,
  onMentionQuery,
  mentionSearchDebounceMs = 300,
  disableDefaultMentionSearch = false,
  renderMentionSuggestion,
  mentionSuggestionOptions,
  classNames: classNamesProp,
  editorRef,
  editable = true,
  ...divProps
}: RichTextEditorProps) {
  // Merge provided classNames with defaults.
  // Memoized so that inline object literals passed as `classNames` prop don't
  // produce a new object on every render — which would otherwise cascade into
  // extensions and useEditor recreating infinitely.
  const cn = useMemo(
    () => generateClassNames([defaultEditorClassNames, classNamesProp]),
    // We compare the *serialised* form of classNamesProp so that structurally
    // identical objects (common with inline literals) are treated as equal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(classNamesProp)],
  )

  // Create a stable debounced search function that recreates when delay changes
  const debouncedSearch = useMemo(
    () => createDebouncedSearch(mentionSearchDebounceMs),
    [mentionSearchDebounceMs],
  )

  // Resolve the mention query function:
  // 1. Consumer-provided  → use as-is
  // 2. Default search disabled → return empty
  // 3. Otherwise → use debounced Bluesky public API search
  const mentionQuery = useMemo<(q: string) => Promise<MentionSuggestion[]>>(() => {
    if (onMentionQuery) return onMentionQuery
    if (disableDefaultMentionSearch) return () => Promise.resolve([])
    return debouncedSearch
  }, [onMentionQuery, disableDefaultMentionSearch, debouncedSearch])

  // Stable values extracted from the memoized cn object.
  // Primitives (strings) are compared by value in useMemo deps, so they won't
  // cause spurious extension re-creations even if the cn object reference changes.
  const linkClass = cn.link ?? 'autolink'
  const mentionClass = cn.mention
  const suggestionClassNames = cn.suggestion
  // Serialise the nested suggestion object so it can be used as a stable dep.
  const suggestionClassNamesKey = JSON.stringify(suggestionClassNames)

  const extensions = useMemo(
    () => [
      Document,
      Paragraph,
      Text,
      History,
      HardBreak,
      // Configure link decorator with the resolved link class
      BskyLinkDecorator.configure({ linkClass }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      createBskyMentionExtension({
        onMentionQuery: mentionQuery,
        ...(mentionClass !== undefined ? { mentionClass } : {}),
        // Only include optional fields when defined (exactOptionalPropertyTypes)
        ...(renderMentionSuggestion !== undefined
          ? { renderSuggestionList: renderMentionSuggestion }
          : {}),
        // Merge suggestion classNames into the default renderer options
        ...(mentionSuggestionOptions !== undefined || suggestionClassNames !== undefined
          ? {
              defaultRendererOptions: {
                ...(mentionSuggestionOptions ?? {}),
                ...(suggestionClassNames !== undefined ? { classNames: suggestionClassNames } : {}),
              },
            }
          : {}),
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      mentionQuery,
      placeholder,
      renderMentionSuggestion,
      mentionSuggestionOptions,
      linkClass,
      mentionClass,
      suggestionClassNamesKey,
    ],
  )

  const editor = useEditor(
    {
      extensions,
      editable,
      content: toInitialHTML(initialValue),

      /**
       * Disable immediate rendering to prevent SSR/hydration issues in Next.js,
       * Remix, and other server-rendering frameworks. The editor defers rendering
       * until after the component mounts on the client.
       * @see https://github.com/ueberdosis/tiptap/issues/5856
       */
      immediatelyRender: false,

      /**
       * Clipboard text serialisation: use '\n' as the block separator so
       * multi-paragraph content is copied as plain newline-delimited text.
       * Matches the Bluesky reference's `coreExtensionOptions.clipboardTextSerializer`.
       */
      coreExtensionOptions: {
        clipboardTextSerializer: {
          blockSeparator: '\n',
        },
      },

      editorProps: {
        /**
         * Paste handler: strip HTML formatting and paste as plain text.
         * Matches `handlePaste` in the Bluesky reference.
         */
        handlePaste(view, event) {
          const clipboardData = event.clipboardData
          if (!clipboardData) return false

          if (clipboardData.types.includes('text/html')) {
            const plainText = clipboardData.getData('text/plain')
            view.pasteText(plainText)
            return true
          }

          return false
        },
      },

      onFocus() {
        onFocus?.()
      },
      onBlur() {
        onBlur?.()
      },

      /**
       * On every document change:
       * 1. Extract plain text from the ProseMirror JSON tree (handles mention nodes)
       * 2. Use @atproto/api's `detectFacetsWithoutResolution()` to populate facets
       * 3. Emit the result as a `RichTextRecord`
       *
       * Mirrors the Bluesky reference's `onUpdate` handler.
       */
      onUpdate({ editor: ed }) {
        if (!onChange) return

        const json = ed.getJSON()
        const text = editorJsonToText(json)

        // Detect facets (mentions as handles, not DIDs — resolve server-side)
        const rt = new AtpRichText({ text })
        rt.detectFacetsWithoutResolution()

        // Cast via unknown: atproto's internal facet type has an extra index
        // signature but is structurally identical to our public Facet type.
        const record: RichTextRecord = {
          text: rt.text,
          ...(rt.facets?.length ? { facets: rt.facets as unknown as Facet[] } : {}),
        }

        onChange(record)
      },
    },
    // Only recreate the editor when extensions change (e.g. placeholder update)
    [extensions],
  )

  // Sync `editable` prop changes reactively after mount
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  // Expose imperative API
  useImperativeHandle(
    editorRef,
    () => ({
      focus() {
        editor?.commands.focus()
      },
      blur() {
        editor?.commands.blur()
      },
      clear() {
        editor?.commands.clearContent(true)
      },
      getText() {
        if (!editor) return ''
        return editorJsonToText(editor.getJSON())
      },
    }),
    [editor],
  )

  return (
    <div className={cn.root} {...divProps}>
      <EditorContent editor={editor} className={cn.content} />
    </div>
  )
}
