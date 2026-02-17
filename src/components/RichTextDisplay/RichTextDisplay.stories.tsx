import type { Meta, StoryObj } from '@storybook/react'
import { RichTextDisplay } from './RichTextDisplay'

// ─── Storybook Meta ──────────────────────────────────────────────────────────

const meta: Meta<typeof RichTextDisplay> = {
  title: 'Components/RichTextDisplay',
  component: RichTextDisplay,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Renders AT Protocol richtext content — a plain string with optional `facets` that annotate byte ranges as @mentions, links, or #hashtags.',
      },
    },
  },
  argTypes: {
    disableLinks: {
      control: 'boolean',
      description: 'Render all facets as plain text with no anchor elements',
    },
  },
}

export default meta
type Story = StoryObj<typeof RichTextDisplay>

// ─── Helpers ─────────────────────────────────────────────────────────────────

const encoder = new TextEncoder()

function bytesOf(text: string, sub: string) {
  const byteStart = encoder.encode(text.slice(0, text.indexOf(sub))).length
  const byteEnd = byteStart + encoder.encode(sub).length
  return { byteStart, byteEnd }
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export const PlainText: Story = {
  args: {
    value: 'Just a plain string with no facets.',
  },
}

export const WithMention: Story = {
  args: {
    value: {
      text: 'Hello @alice.bsky.social, how are you?',
      facets: [
        {
          index: bytesOf('Hello @alice.bsky.social, how are you?', '@alice.bsky.social'),
          features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice123' }],
        },
      ],
    },
  },
}

export const WithLink: Story = {
  args: {
    value: {
      text: 'Check out https://bsky.app for the latest!',
      facets: [
        {
          index: bytesOf('Check out https://bsky.app for the latest!', 'https://bsky.app'),
          features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://bsky.app' }],
        },
      ],
    },
  },
}

export const WithHashtag: Story = {
  args: {
    value: {
      text: 'Love building with #atproto and #bluesky!',
      facets: [
        {
          index: bytesOf('Love building with #atproto and #bluesky!', '#atproto'),
          features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'atproto' }],
        },
        {
          index: bytesOf('Love building with #atproto and #bluesky!', '#bluesky'),
          features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'bluesky' }],
        },
      ],
    },
  },
}

export const AllFacetTypes: Story = {
  name: 'All Facet Types',
  args: {
    value: {
      text: 'Hey @alice.bsky.social! Check https://bsky.app — love #atproto',
      facets: [
        {
          index: bytesOf(
            'Hey @alice.bsky.social! Check https://bsky.app — love #atproto',
            '@alice.bsky.social',
          ),
          features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice123' }],
        },
        {
          index: bytesOf(
            'Hey @alice.bsky.social! Check https://bsky.app — love #atproto',
            'https://bsky.app',
          ),
          features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://bsky.app' }],
        },
        {
          index: bytesOf(
            'Hey @alice.bsky.social! Check https://bsky.app — love #atproto',
            '#atproto',
          ),
          features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'atproto' }],
        },
      ],
    },
  },
}

export const LinksDisabled: Story = {
  name: 'Links Disabled',
  args: {
    ...AllFacetTypes.args,
    disableLinks: true,
  },
}

export const CustomMentionRenderer: Story = {
  name: 'Custom Mention Renderer',
  args: {
    value: {
      text: 'Hello @alice.bsky.social!',
      facets: [
        {
          index: bytesOf('Hello @alice.bsky.social!', '@alice.bsky.social'),
          features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice123' }],
        },
      ],
    },
    renderMention: ({ text, did }) => (
      <span
        style={{
          background: '#e8f0fe',
          color: '#1a73e8',
          borderRadius: 4,
          padding: '0 4px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
        title={`DID: ${did}`}
      >
        {text}
      </span>
    ),
  },
}

export const MultibyteText: Story = {
  name: 'Multibyte / Emoji Text',
  args: {
    value: {
      text: '🎉 Congrats @alice.bsky.social on #atproto! 🚀',
      facets: [
        {
          index: bytesOf('🎉 Congrats @alice.bsky.social on #atproto! 🚀', '@alice.bsky.social'),
          features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice123' }],
        },
        {
          index: bytesOf('🎉 Congrats @alice.bsky.social on #atproto! 🚀', '#atproto'),
          features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'atproto' }],
        },
      ],
    },
  },
}
