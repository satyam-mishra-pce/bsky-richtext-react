import {
  useEffect,
  useImperativeHandle,
  useMemo,
  type HTMLAttributes,
  type Ref,
} from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import { Document } from '@tiptap/extension-document'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { History } from '@tiptap/extension-history'
import { HardBreak } from '@tiptap/extension-hard-break'
import { Placeholder } from '@tiptap/extension-placeholder'
import type { SuggestionOptions } from '@tiptap/suggestion'
import type { RichTextRecord } from '../../types/facets'
import { createBskyMentionExtension } from './extensions/BskyMention'
import { BskyLinkDecorator } from './extensions/BskyLinkDecorator'

// ─── Public Types ────────────────────────────────────────────────────────────

/**
 * A single suggestion item for the @mention autocomplete popup.
 * Consumers shape this however they want — it is passed back to
 * `renderMentionSuggestion`.
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

export interface RichTextEditorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Initial richtext value. The editor will be pre-populated with this content.
   * Note: this is only used on mount (uncontrolled initial state).
   * Use `onChange` to track updates.
   */
  initialValue?: RichTextRecord | string

  /**
   * Called on every content change with the current richtext record.
   * The `facets` are detected without resolution (handles, not DIDs)
   * — resolve them server-side before persisting.
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
   * Called with the text after "@" as the user types.
   * Return an empty array to show no suggestions.
   */
  onMentionQuery?: (query: string) => Promise<MentionSuggestion[]>

  /**
   * Custom render factory for the mention suggestion dropdown.
   * Must return an object with `onStart`, `onUpdate`, `onKeyDown`, `onExit`
   * callbacks (TipTap SuggestionOptions render interface).
   * If omitted, no dropdown is shown — useful for headless setups.
   */
  renderMentionSuggestion?: SuggestionOptions['render']

  /**
   * Imperative ref for programmatic control (focus, blur, clear, getText).
   */
  editorRef?: Ref<RichTextEditorRef>

  /**
   * Whether the editor is editable.
   * @default true
   */
  editable?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Convert a `RichTextRecord` or string to the plain HTML the editor
 * uses for its initial content. TipTap stores content as ProseMirror JSON
 * internally; we start from plain text.
 */
function toInitialContent(value: RichTextRecord | string | undefined): string {
  if (!value) return ''
  const text = typeof value === 'string' ? value : value.text
  // Wrap in a paragraph so TipTap's Document/Paragraph schema is satisfied
  return `<p>${text}</p>`
}

/**
 * Extract plain text from the TipTap editor, using newlines as block separators.
 */
function editorToPlainText(html: string): string {
  // Simple: strip all tags, decode entities
  return html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trimEnd()
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * `RichTextEditor` is a TipTap-based rich text editor tailored for the
 * AT Protocol. It supports:
 *
 * - Real-time @mention autocomplete with DID resolution
 * - Automatic URL detection and decoration
 * - Hard-break (Shift+Enter) support
 * - Undo/redo history
 * - Headless design — bring your own styling
 *
 * @example
 * ```tsx
 * <RichTextEditor
 *   placeholder="What's on your mind?"
 *   onMentionQuery={async (q) => searchProfiles(q)}
 *   onChange={(record) => setPost(record)}
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
  renderMentionSuggestion,
  editorRef,
  editable = true,
  ...divProps
}: RichTextEditorProps) {
  // Default no-op for mention query when not provided
  const mentionQuery = useMemo(
    () => onMentionQuery ?? (() => Promise.resolve([])),
    [onMentionQuery],
  )

  const extensions = useMemo(
    () => [
      Document,
      Paragraph,
      Text,
      History,
      HardBreak,
      BskyLinkDecorator,
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      createBskyMentionExtension(mentionQuery, renderMentionSuggestion),
    ],
    // Extensions should only rebuild when stable deps change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mentionQuery, placeholder],
  )

  const editor = useEditor({
    extensions,
    editable,
    content: toInitialContent(initialValue),
    onFocus() {
      onFocus?.()
    },
    onBlur() {
      onBlur?.()
    },
    onUpdate({ editor: ed }) {
      if (!onChange) return

      const html = ed.getHTML()
      const text = editorToPlainText(html)

      // Emit a basic RichTextRecord — facet detection happens here.
      // For now we emit plain text; facet parsing from the ProseMirror
      // node tree (mentions, links) will be added in a future iteration.
      onChange({ text })
    },
  })

  // Sync `editable` prop changes after mount
  useEffect(() => {
    editor?.setEditable(editable)
  }, [editor, editable])

  // Expose imperative API via editorRef
  useImperativeHandle(
    editorRef,
    () => ({
      focus: () => {
        editor?.commands.focus()
      },
      blur: () => {
        editor?.commands.blur()
      },
      clear: () => {
        editor?.commands.clearContent(true)
      },
      getText: () => {
        return editorToPlainText(editor?.getHTML() ?? '')
      },
    }),
    [editor],
  )

  return (
    <div data-bsky-richtext-editor {...divProps}>
      <EditorContent editor={editor} />
    </div>
  )
}
