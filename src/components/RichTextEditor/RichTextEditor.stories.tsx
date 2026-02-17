import type { Meta, StoryObj } from '@storybook/react'
import { useState, useRef } from 'react'
import { RichTextEditor } from './RichTextEditor'
import type { RichTextEditorRef, MentionSuggestion } from './RichTextEditor'
import type { RichTextRecord } from '../../types/facets'
import { generateClassNames, defaultEditorClassNames } from '../../index'

// ─── Storybook Meta ──────────────────────────────────────────────────────────

const meta: Meta<typeof RichTextEditor> = {
  title: 'Components/RichTextEditor',
  component: RichTextEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    // Disable Storybook's automatic action-arg injection for all event props.
    // Without this, Storybook replaces the real onChange/onFocus/etc. with
    // spy functions, which breaks stories that pass real handlers.
    actions: { argTypesRegex: '' },
    docs: {
      description: {
        component: [
          'A TipTap-based editor for composing AT Protocol richtext content.',
          '',
          '**Features:**',
          '- Real-time @mention autocomplete — defaults to the **Bluesky public API** (debounced)',
          '- Automatic URL decoration (stateless ProseMirror decorations)',
          '- Hard-break (Shift+Enter) support',
          '- Undo/redo history',
          '- `onChange` emits a `RichTextRecord` with facets from `detectFacetsWithoutResolution()`',
          '- Headless — style via `classNames` prop or target CSS classes directly',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    onChange: { control: false, table: { category: 'Events' } },
    onFocus: { control: false, table: { category: 'Events' } },
    onBlur: { control: false, table: { category: 'Events' } },
    onMentionQuery: { control: false, table: { category: 'Events' } },
    renderMentionSuggestion: { control: false, table: { category: 'Advanced' } },
    editorRef: { control: false, table: { category: 'Advanced' } },
    mentionSuggestionOptions: { control: false, table: { category: 'Advanced' } },
    classNames: { control: false, table: { category: 'Styling' } },
    initialValue: { control: 'text' },
    placeholder: { control: 'text' },
    editable: { control: 'boolean' },
    mentionSearchDebounceMs: { control: 'number', table: { category: 'Mention Search' } },
    disableDefaultMentionSearch: { control: 'boolean', table: { category: 'Mention Search' } },
  },
}

export default meta
type Story = StoryObj<typeof RichTextEditor>

// ─── Shared styles ───────────────────────────────────────────────────────────

const editorStyle: React.CSSProperties = {
  border: '1px solid #e1e4e8',
  borderRadius: 8,
  padding: '12px 16px',
  minHeight: 120,
  fontSize: 16,
  lineHeight: 1.5,
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

/** Inline CSS for the suggestion dropdown — used in several stories */
const SUGGESTION_STYLES = `
  .bsky-suggestions {
    background: #fff;
    border: 1px solid #e1e4e8;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    overflow: hidden;
    min-width: 240px;
    padding: 4px;
  }
  .bsky-suggestion-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    cursor: pointer;
    border-radius: 6px;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    font-family: inherit;
    font-size: 14px;
  }
  .bsky-suggestion-item:hover { background: #f6f8fa; }
  .bsky-suggestion-item-selected { background: #f0f4ff; }
  .bsky-suggestion-avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
  }
  .bsky-suggestion-avatar-img { width: 100%; height: 100%; object-fit: cover; }
  .bsky-suggestion-avatar-placeholder {
    display: flex;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e1e4e8;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    color: #555;
  }
  .bsky-suggestion-text { display: flex; flex-direction: column; gap: 1px; }
  .bsky-suggestion-name { font-weight: 600; color: #0f1419; font-size: 14px; }
  .bsky-suggestion-handle { color: #536471; font-size: 13px; }
  .bsky-suggestion-empty { padding: 10px 14px; color: #536471; font-size: 14px; }
  .bsky-editor-mention { color: #0085ff; font-weight: 500; }
  .autolink { color: #0f766e; text-decoration: underline; cursor: pointer; }
`

// ─── Mock Suggestions ────────────────────────────────────────────────────────

const MOCK_SUGGESTIONS: MentionSuggestion[] = [
  {
    did: 'did:plc:alice123',
    handle: 'alice.bsky.social',
    displayName: 'Alice',
    avatarUrl: 'https://i.pravatar.cc/40?u=alice',
  },
  {
    did: 'did:plc:bob456',
    handle: 'bob.bsky.social',
    displayName: 'Bob',
    avatarUrl: 'https://i.pravatar.cc/40?u=bob',
  },
  {
    did: 'did:plc:carol789',
    handle: 'carol.bsky.social',
    displayName: 'Carol',
    // No avatar — will show initial placeholder
  },
  {
    did: 'did:plc:dave000',
    handle: 'dave.dev',
    displayName: 'Dave the Developer',
    avatarUrl: 'https://i.pravatar.cc/40?u=dave',
  },
]

async function mockMentionQuery(query: string): Promise<MentionSuggestion[]> {
  await new Promise<void>((r) => setTimeout(r, 80))
  const q = query.toLowerCase()
  return MOCK_SUGGESTIONS.filter(
    (s) =>
      s.handle.toLowerCase().includes(q) ||
      (s.displayName?.toLowerCase().includes(q) ?? false),
  )
}

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Default editor with the built-in Bluesky public API mention search.
 * Type "@" followed by a Bluesky handle to see live suggestions from the real API.
 */
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Uses the built-in Bluesky public API search by default. ' +
          'Type `@` followed by a handle fragment (e.g. `@jay`) to fetch real suggestions.',
      },
    },
  },
  render: (args) => (
    <>
      <style>{SUGGESTION_STYLES}</style>
      <RichTextEditor {...args} />
    </>
  ),
  args: {
    placeholder: "What's on your mind? (type @ for live Bluesky suggestions)",
    style: editorStyle,
  },
}

export const WithInitialContent: Story = {
  name: 'With Initial Content',
  render: (args) => (
    <>
      <style>{SUGGESTION_STYLES}</style>
      <RichTextEditor {...args} />
    </>
  ),
  args: {
    ...Default.args,
    placeholder: "What's on your mind?",
    initialValue: 'Hello! This is some initial content in the editor.',
  },
}

export const ReadOnly: Story = {
  name: 'Read-Only',
  args: {
    placeholder: "What's on your mind?",
    initialValue: 'This content is read-only and cannot be edited.',
    editable: false,
    style: {
      ...editorStyle,
      background: '#f6f8fa',
      cursor: 'default',
      color: '#555',
    },
  },
}

/**
 * Type "@" followed by any letter to trigger the mention autocomplete popup.
 * Suggestions come from a **mock local array** (no real network requests).
 */
export const WithMockMentions: Story = {
  name: 'With Mock Mention Autocomplete',
  parameters: {
    docs: {
      description: {
        story:
          'Uses a local mock `onMentionQuery` instead of the real Bluesky API. ' +
          'Type `@a`, `@b`, `@c`, or `@d` to see suggestions from the mock data.',
      },
    },
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [record, setRecord] = useState<RichTextRecord>({ text: '' })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <style>{SUGGESTION_STYLES}</style>

        <RichTextEditor
          {...args}
          onMentionQuery={mockMentionQuery}
          onChange={setRecord}
        />

        <div>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#536471', fontFamily: 'monospace' }}>
            RichTextRecord output:
          </p>
          <pre
            style={{
              background: '#f6f8fa',
              padding: 12,
              borderRadius: 6,
              fontSize: 12,
              margin: 0,
              overflow: 'auto',
              fontFamily: 'monospace',
            }}
          >
            {JSON.stringify(record, null, 2)}
          </pre>
        </div>
      </div>
    )
  },
  args: {
    style: editorStyle,
    placeholder: 'Type "@" to mention someone (mock data)…',
  },
}

/**
 * Control the editor programmatically via the imperative ref API.
 */
export const WithImperativeRef: Story = {
  name: 'Imperative Ref (focus / clear)',
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ref = useRef<RichTextEditorRef>(null)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <RichTextEditor {...args} editorRef={ref} />
        <div style={{ display: 'flex', gap: 8 }}>
          {(['Focus', 'Blur', 'Clear'] as const).map((action) => (
            <button
              key={action}
              onClick={() => ref.current?.[action.toLowerCase() as 'focus' | 'blur' | 'clear']()}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid #e1e4e8',
                background: '#fff',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 14,
              }}
            >
              {action}
            </button>
          ))}
          <button
            onClick={() => alert(ref.current?.getText() ?? '')}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #e1e4e8',
              background: '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 14,
            }}
          >
            Alert text
          </button>
        </div>
      </div>
    )
  },
  args: {
    style: editorStyle,
    placeholder: "What's on your mind?",
    initialValue: 'Click the buttons below to control the editor imperatively.',
  },
}

/**
 * Watch the RichTextRecord update in real time as you type.
 * Mentions, links, and hashtags will appear as facets in the output.
 */
export const OnChangeOutput: Story = {
  name: 'onChange Output',
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [record, setRecord] = useState<RichTextRecord>({ text: '' })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <style>{SUGGESTION_STYLES}</style>
        <RichTextEditor {...args} onChange={setRecord} onMentionQuery={mockMentionQuery} />
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#536471', fontFamily: 'monospace' }}>
            RichTextRecord output (updates live):
          </p>
          <pre
            style={{
              background: '#f6f8fa',
              padding: 12,
              borderRadius: 6,
              fontSize: 12,
              margin: 0,
              overflow: 'auto',
              fontFamily: 'monospace',
            }}
          >
            {JSON.stringify(record, null, 2)}
          </pre>
        </div>
      </div>
    )
  },
  args: {
    style: editorStyle,
    placeholder: 'Type something… try a URL, a #hashtag, or "@" a mention',
  },
}

/**
 * Demonstrates `classNames` prop with `generateClassNames()` for deep merging.
 * The defaults provide structural class names; we layer visual styles on top.
 */
export const WithCustomClassNames: Story = {
  name: 'Custom ClassNames',
  parameters: {
    docs: {
      description: {
        story:
          'Uses `generateClassNames([defaultEditorClassNames, overrides])` to add ' +
          'visual styling on top of the structural defaults. The `suggestion` key is ' +
          'deeply merged, so you only need to override the parts you care about.',
      },
    },
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [_record, setRecord] = useState<RichTextRecord>({ text: '' })

    const myClassNames = generateClassNames([
      defaultEditorClassNames,
      {
        root: 'my-editor-root',
        mention: 'my-editor-mention',
        link: 'my-autolink',
        suggestion: {
          root: 'my-suggestions',
          item: 'my-suggestion-item',
          itemSelected: 'my-suggestion-selected',
        },
      },
    ])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <style>{`
          /* Custom classes appended by generateClassNames */
          .my-editor-root { border: 2px solid #7c3aed; border-radius: 12px; padding: 12px 16px; }
          .my-editor-mention { color: #7c3aed; font-weight: 600; }
          .my-autolink { color: #0f766e; text-decoration: underline; }
          .my-suggestions {
            background: #faf5ff; border: 1px solid #c4b5fd; border-radius: 8px;
            box-shadow: 0 4px 16px rgba(124,58,237,0.15); overflow: hidden; min-width: 240px; padding: 4px;
          }
          .my-suggestion-item {
            display: flex; align-items: center; gap: 10px;
            padding: 8px 10px; cursor: pointer; border-radius: 6px;
            border: none; background: transparent; width: 100%;
            text-align: left; font-family: inherit; font-size: 14px;
          }
          .my-suggestion-item:hover { background: #ede9fe; }
          .my-suggestion-selected { background: #ddd6fe; }
          /* Keep structural classes for avatar etc */
          .bsky-suggestion-avatar { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; overflow: hidden; }
          .bsky-suggestion-avatar-img { width: 100%; height: 100%; object-fit: cover; }
          .bsky-suggestion-avatar-placeholder {
            display: flex; width: 32px; height: 32px; border-radius: 50%;
            background: #c4b5fd; align-items: center; justify-content: center;
            font-weight: 600; font-size: 14px; color: #4c1d95;
          }
          .bsky-suggestion-text { display: flex; flex-direction: column; gap: 1px; }
          .bsky-suggestion-name { font-weight: 600; color: #0f1419; font-size: 14px; }
          .bsky-suggestion-handle { color: #7c3aed; font-size: 13px; }
          .bsky-suggestion-empty { padding: 10px 14px; color: #7c3aed; font-size: 14px; }
        `}</style>

        <RichTextEditor
          {...args}
          classNames={myClassNames}
          onMentionQuery={mockMentionQuery}
          onChange={setRecord}
        />

        <div>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: '#536471', fontFamily: 'monospace' }}>
            Applied classNames:
          </p>
          <pre style={{
            background: '#faf5ff', border: '1px solid #c4b5fd',
            padding: 12, borderRadius: 6, fontSize: 11, margin: 0, overflow: 'auto', fontFamily: 'monospace',
          }}>
            {JSON.stringify(myClassNames, null, 2)}
          </pre>
        </div>
      </div>
    )
  },
  args: {
    placeholder: 'Type "@" to see purple-themed suggestions…',
  },
}

/**
 * Demonstrates the `mentionSearchDebounceMs` prop.
 * A longer debounce reduces API calls at the cost of slightly slower suggestions.
 */
export const CustomDebounce: Story = {
  name: 'Custom Debounce Delay',
  parameters: {
    docs: {
      description: {
        story:
          'Sets `mentionSearchDebounceMs={600}` to wait 600ms before querying. ' +
          'Useful for slow connections or rate-limited APIs.',
      },
    },
  },
  render: (args) => (
    <>
      <style>{SUGGESTION_STYLES}</style>
      <RichTextEditor {...args} />
    </>
  ),
  args: {
    style: editorStyle,
    placeholder: 'Type "@jay" — suggestions appear after 600ms pause',
    mentionSearchDebounceMs: 600,
  },
}

/**
 * Demonstrates `disableDefaultMentionSearch` — no suggestions appear unless
 * you wire up your own `onMentionQuery`.
 */
export const NoDefaultSearch: Story = {
  name: 'Default Search Disabled',
  parameters: {
    docs: {
      description: {
        story:
          'Sets `disableDefaultMentionSearch={true}`. ' +
          'No suggestions appear when typing "@" — useful when you want full control ' +
          'over the search via a custom `onMentionQuery`.',
      },
    },
  },
  args: {
    style: editorStyle,
    placeholder: 'Type "@" — no suggestions will appear (default search disabled)',
    disableDefaultMentionSearch: true,
  },
}
