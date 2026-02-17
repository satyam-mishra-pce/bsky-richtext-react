import type { Meta, StoryObj } from '@storybook/react'
import { RichTextDisplay } from './RichTextDisplay'
import { generateClassNames, defaultDisplayClassNames } from '../../index'

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

/**
 * Use `generateClassNames()` to layer your own classes on top of the defaults.
 * The built-in `bsky-mention`, `bsky-link`, `bsky-tag` classes remain active;
 * your classes are appended via space-join (or your custom `cn` function).
 */
export const WithCustomClassNames: Story = {
  name: 'Custom ClassNames',
  parameters: {
    docs: {
      description: {
        story:
          'Uses `generateClassNames([defaultDisplayClassNames, overrides])` to add ' +
          'visual styling classes on top of the structural defaults. ' +
          'The example targets `.bsky-mention`, `.bsky-link`, `.bsky-tag` via injected `<style>`.',
      },
    },
  },
  render: (args) => (
    <>
      <style>{`
        .bsky-mention { color: #0085ff; font-weight: 600; text-decoration: none; }
        .bsky-mention:hover { text-decoration: underline; }
        .bsky-link { color: #0f766e; text-decoration: underline; }
        .bsky-tag { color: #7c3aed; font-weight: 600; text-decoration: none; }
        .bsky-tag:hover { text-decoration: underline; }
      `}</style>
      <RichTextDisplay
        {...args}
        classNames={generateClassNames([defaultDisplayClassNames])}
      />
    </>
  ),
  args: {
    ...AllFacetTypes.args,
  },
}

/**
 * URL resolvers let you point mentions, links, and hashtags to your own routes
 * instead of the default `https://bsky.app/...` URLs.
 */
export const WithURLResolvers: Story = {
  name: 'Custom URL Resolvers',
  parameters: {
    docs: {
      description: {
        story:
          'The `mentionUrl`, `tagUrl`, and `linkUrl` props let you customise where ' +
          'each facet type links to — useful for internal routing or link proxying.',
      },
    },
  },
  args: {
    ...AllFacetTypes.args,
    mentionUrl: (did) => `/profile/${did}`,
    tagUrl: (tag) => `/search?tag=${encodeURIComponent(tag)}`,
    linkUrl: (uri) => `https://go.myapp.com?url=${encodeURIComponent(uri)}`,
  },
}
