import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RichTextDisplay } from './RichTextDisplay'
import type { RichTextRecord } from '../../types/facets'

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildRecord(
  text: string,
  facets: RichTextRecord['facets'],
): RichTextRecord {
  return { text, facets }
}

function encodeOffset(text: string, substring: string): { byteStart: number; byteEnd: number } {
  const encoder = new TextEncoder()
  const fullBytes = encoder.encode(text)
  const subBytes = encoder.encode(substring)

  // Find the byte offset of the substring
  const str = new TextDecoder().decode(fullBytes)
  const charIndex = str.indexOf(substring)
  const byteStart = encoder.encode(str.slice(0, charIndex)).length
  const byteEnd = byteStart + subBytes.length

  return { byteStart, byteEnd }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('RichTextDisplay', () => {
  it('renders plain text with no facets', () => {
    render(<RichTextDisplay value="Hello world" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders plain string value', () => {
    render(<RichTextDisplay value="Simple string" />)
    expect(screen.getByText('Simple string')).toBeInTheDocument()
  })

  it('renders a mention as a link by default', () => {
    const text = 'Hello @alice.bsky.social!'
    const { byteStart, byteEnd } = encodeOffset(text, '@alice.bsky.social')

    render(
      <RichTextDisplay
        value={buildRecord(text, [
          {
            index: { byteStart, byteEnd },
            features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice123' }],
          },
        ])}
      />,
    )

    const link = screen.getByRole('link', { name: '@alice.bsky.social' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://bsky.app/profile/did:plc:alice123')
  })

  it('renders a link as an anchor by default', () => {
    const text = 'Visit https://bsky.app for more'
    const { byteStart, byteEnd } = encodeOffset(text, 'https://bsky.app')

    render(
      <RichTextDisplay
        value={buildRecord(text, [
          {
            index: { byteStart, byteEnd },
            features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://bsky.app' }],
          },
        ])}
      />,
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://bsky.app')
  })

  it('renders a hashtag as a link by default', () => {
    const text = 'I love #atproto!'
    const { byteStart, byteEnd } = encodeOffset(text, '#atproto')

    render(
      <RichTextDisplay
        value={buildRecord(text, [
          {
            index: { byteStart, byteEnd },
            features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'atproto' }],
          },
        ])}
      />,
    )

    const link = screen.getByRole('link', { name: '#atproto' })
    expect(link).toHaveAttribute('href', 'https://bsky.app/hashtag/atproto')
  })

  it('renders plain text when disableLinks is true', () => {
    const text = 'Hello @alice.bsky.social!'
    const { byteStart, byteEnd } = encodeOffset(text, '@alice.bsky.social')

    render(
      <RichTextDisplay
        value={buildRecord(text, [
          {
            index: { byteStart, byteEnd },
            features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice123' }],
          },
        ])}
        disableLinks
      />,
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('@alice.bsky.social', { exact: false })).toBeInTheDocument()
  })

  it('uses a custom renderMention when provided', () => {
    const text = 'Hello @alice.bsky.social'
    const { byteStart, byteEnd } = encodeOffset(text, '@alice.bsky.social')

    const renderMention = vi.fn(({ text: t }: { text: string }) => (
      <span data-testid="custom-mention">{t}</span>
    ))

    render(
      <RichTextDisplay
        value={buildRecord(text, [
          {
            index: { byteStart, byteEnd },
            features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice123' }],
          },
        ])}
        renderMention={renderMention}
      />,
    )

    expect(screen.getByTestId('custom-mention')).toBeInTheDocument()
    expect(renderMention).toHaveBeenCalledOnce()
  })

  it('forwards extra props to the root span', () => {
    render(
      <RichTextDisplay
        value="test"
        data-testid="richtext-root"
        className="my-class"
      />,
    )

    const root = screen.getByTestId('richtext-root')
    expect(root).toHaveClass('my-class')
    expect(root.tagName).toBe('SPAN')
  })

  it('has default bsky-richtext class on root', () => {
    render(<RichTextDisplay value="test" data-testid="root" />)
    const root = screen.getByTestId('root')
    expect(root).toHaveClass('bsky-richtext')
  })
})
