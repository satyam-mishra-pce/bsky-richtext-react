import type { Meta, StoryObj } from '@storybook/react'
import { useState, useRef } from 'react'
import { RichTextEditor } from './RichTextEditor'
import type { RichTextEditorRef, MentionSuggestion } from './RichTextEditor'
import type { RichTextRecord } from '../../types/facets'

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
          '- Real-time @mention autocomplete (powered by tippy.js by default)',
          '- Automatic URL decoration',
          '- Hard-break (Shift+Enter) support',
          '- Undo/redo history',
          '- `onChange` emits a `RichTextRecord` with facets populated via `detectFacetsWithoutResolution()`',
          '- Headless — bring your own styles',
        ].join('\n'),
      },
    },
  },
  argTypes: {
    // Prevent Storybook from treating these as "action" args with spy injection
    onChange: { control: false, table: { category: 'Events' } },
    onFocus: { control: false, table: { category: 'Events' } },
    onBlur: { control: false, table: { category: 'Events' } },
    onMentionQuery: { control: false, table: { category: 'Events' } },
    renderMentionSuggestion: { control: false, table: { category: 'Advanced' } },
    editorRef: { control: false, table: { category: 'Advanced' } },
    mentionSuggestionOptions: { control: false, table: { category: 'Advanced' } },
    initialValue: { control: 'text' },
    placeholder: { control: 'text' },
    editable: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof RichTextEditor>

// ─── Shared base style ───────────────────────────────────────────────────────

const editorStyle: React.CSSProperties = {
  border: '1px solid #e1e4e8',
  borderRadius: 8,
  padding: '12px 16px',
  minHeight: 120,
  fontSize: 16,
  lineHeight: 1.5,
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

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
  // Simulate a real network round-trip
  await new Promise<void>((r) => setTimeout(r, 80))
  const q = query.toLowerCase()
  return MOCK_SUGGESTIONS.filter(
    (s) =>
      s.handle.toLowerCase().includes(q) ||
      (s.displayName?.toLowerCase().includes(q) ?? false),
  )
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    placeholder: "What's on your mind?",
    style: editorStyle,
  },
}

export const WithInitialContent: Story = {
  name: 'With Initial Content',
  args: {
    ...Default.args,
    initialValue: 'Hello! This is some initial content in the editor.',
  },
}

export const ReadOnly: Story = {
  name: 'Read-Only',
  args: {
    ...Default.args,
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
 * Suggestions are mocked with a short delay to simulate a real API call.
 * Arrow keys navigate, Enter/Tab selects, Escape dismisses.
 */
export const WithMentionAutocomplete: Story = {
  name: 'With Mention Autocomplete',
  parameters: {
    docs: {
      description: {
        story:
          'Type `@` followed by a letter (e.g. `@a`) to trigger the suggestion popup. ' +
          'Use ↑/↓ to navigate, Enter or Tab to select, Escape to dismiss. ' +
          'The `RichTextRecord` output is shown below the editor in real time.',
      },
    },
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [record, setRecord] = useState<RichTextRecord>({ text: '' })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Minimal suggestion list styles so it's visible in Storybook */}
        <style>{`
          [data-bsky-mention-suggestions] {
            background: #fff;
            border: 1px solid #e1e4e8;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.12);
            overflow: hidden;
            min-width: 240px;
            padding: 4px;
          }
          [data-bsky-mention-suggestion-item] {
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
          [data-bsky-mention-suggestion-item][data-selected] {
            background: #f0f4ff;
          }
          [data-bsky-mention-suggestion-item]:hover {
            background: #f6f8fa;
          }
          [data-bsky-mention-avatar] {
            flex-shrink: 0;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            overflow: hidden;
          }
          [data-bsky-mention-avatar-img] {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          [data-bsky-mention-avatar-placeholder] {
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
          [data-bsky-mention-suggestion-text] {
            display: flex;
            flex-direction: column;
            gap: 1px;
          }
          [data-bsky-mention-suggestion-name] {
            font-weight: 600;
            color: #0f1419;
            font-size: 14px;
          }
          [data-bsky-mention-suggestion-handle] {
            color: #536471;
            font-size: 13px;
          }
          [data-bsky-mention-suggestion-empty] {
            padding: 10px 14px;
            color: #536471;
            font-size: 14px;
          }
          /* Style inserted mention chips in the editor */
          [data-bsky-richtext-editor] .bsky-mention {
            color: #0085ff;
            font-weight: 500;
          }
        `}</style>

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
    ...Default.args,
    placeholder: 'Type "@" to mention someone…',
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
    ...Default.args,
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
    ...Default.args,
    placeholder: 'Type something… try a URL, a #hashtag, or "@" a mention',
  },
}
