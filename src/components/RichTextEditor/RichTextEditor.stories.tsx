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
    docs: {
      description: {
        component: [
          'A TipTap-based editor for composing AT Protocol richtext content.',
          '',
          'Features:',
          '- Real-time @mention autocomplete (plug in your own suggestion fetcher)',
          '- Automatic URL decoration',
          '- Hard-break (Shift+Enter) support',
          '- Undo/redo history',
          '- Headless — bring your own styles',
        ].join('\n'),
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof RichTextEditor>

// ─── Mock Suggestions ────────────────────────────────────────────────────────

const MOCK_SUGGESTIONS: MentionSuggestion[] = [
  { did: 'did:plc:alice123', handle: 'alice.bsky.social', displayName: 'Alice' },
  { did: 'did:plc:bob456', handle: 'bob.bsky.social', displayName: 'Bob' },
  { did: 'did:plc:carol789', handle: 'carol.bsky.social', displayName: 'Carol' },
]

async function mockMentionQuery(query: string): Promise<MentionSuggestion[]> {
  await new Promise((r) => setTimeout(r, 100)) // simulate network
  return MOCK_SUGGESTIONS.filter(
    (s) =>
      s.handle.includes(query.toLowerCase()) ||
      (s.displayName?.toLowerCase().includes(query.toLowerCase()) ?? false),
  )
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    placeholder: "What's on your mind?",
    style: {
      border: '1px solid #e1e4e8',
      borderRadius: 8,
      padding: '12px 16px',
      minHeight: 120,
      fontSize: 16,
      lineHeight: 1.5,
    },
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
      ...Default.args?.style,
      background: '#f6f8fa',
      cursor: 'default',
    },
  },
}

export const WithMentionQuery: Story = {
  name: 'With Mention Autocomplete',
  parameters: {
    docs: {
      description: {
        story:
          'Type "@" followed by a letter to trigger mention autocomplete. ' +
          'Suggestions are mocked — in real usage, wire `onMentionQuery` to your API.',
      },
    },
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [record, setRecord] = useState<RichTextRecord>({ text: '' })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <RichTextEditor
          {...args}
          onMentionQuery={mockMentionQuery}
          onChange={setRecord}
        />
        <pre
          style={{
            background: '#f6f8fa',
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
            overflow: 'auto',
          }}
        >
          <strong>RichTextRecord output:</strong>
          {'\n'}
          {JSON.stringify(record, null, 2)}
        </pre>
      </div>
    )
  },
  args: {
    ...Default.args,
    placeholder: 'Try typing "@" to mention someone…',
  },
}

export const WithImperativeRef: Story = {
  name: 'Imperative Ref (focus / clear)',
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ref = useRef<RichTextEditorRef>(null)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <RichTextEditor {...args} editorRef={ref} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => ref.current?.focus()}>Focus</button>
          <button onClick={() => ref.current?.blur()}>Blur</button>
          <button onClick={() => ref.current?.clear()}>Clear</button>
          <button onClick={() => alert(ref.current?.getText())}>Alert text</button>
        </div>
      </div>
    )
  },
  args: {
    ...Default.args,
    initialValue: 'Click the buttons below to control the editor.',
  },
}

export const OnChangeOutput: Story = {
  name: 'onChange Output',
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [record, setRecord] = useState<RichTextRecord>({ text: '' })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <RichTextEditor {...args} onChange={setRecord} />
        <pre
          style={{
            background: '#f6f8fa',
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
            overflow: 'auto',
          }}
        >
          {JSON.stringify(record, null, 2)}
        </pre>
      </div>
    )
  },
  args: {
    ...Default.args,
    placeholder: 'Start typing to see the RichTextRecord output below…',
  },
}
