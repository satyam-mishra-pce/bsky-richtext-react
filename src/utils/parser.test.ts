import { describe, it, expect } from 'vitest'
import { parseRichText } from './parser'
import type { RichTextRecord } from '../types/facets'

describe('parseRichText', () => {
  it('returns a single plain segment when there are no facets', () => {
    const record: RichTextRecord = { text: 'Hello world' }
    const segments = parseRichText(record)
    expect(segments).toEqual([{ text: 'Hello world' }])
  })

  it('returns a single plain segment for empty facets array', () => {
    const record: RichTextRecord = { text: 'Hello world', facets: [] }
    const segments = parseRichText(record)
    expect(segments).toEqual([{ text: 'Hello world' }])
  })

  it('correctly segments a mention', () => {
    const text = 'Hello @alice.bsky.social!'
    // '@alice.bsky.social' starts at byte 6, ends at byte 24
    const mentionBytes = new TextEncoder().encode('@alice.bsky.social')
    const byteStart = 6
    const byteEnd = byteStart + mentionBytes.length

    const record: RichTextRecord = {
      text,
      facets: [
        {
          index: { byteStart, byteEnd },
          features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice' }],
        },
      ],
    }

    const segments = parseRichText(record)

    expect(segments).toHaveLength(3)
    expect(segments[0]).toEqual({ text: 'Hello ' })
    expect(segments[1]).toEqual({
      text: '@alice.bsky.social',
      feature: { $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice' },
    })
    expect(segments[2]).toEqual({ text: '!' })
  })

  it('correctly segments a link', () => {
    const text = 'Check https://bsky.app out'
    const linkText = 'https://bsky.app'
    const byteStart = 6
    const byteEnd = byteStart + new TextEncoder().encode(linkText).length

    const record: RichTextRecord = {
      text,
      facets: [
        {
          index: { byteStart, byteEnd },
          features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://bsky.app' }],
        },
      ],
    }

    const segments = parseRichText(record)

    expect(segments).toHaveLength(3)
    expect(segments[0]?.text).toBe('Check ')
    expect(segments[1]?.text).toBe('https://bsky.app')
    expect(segments[1]?.feature).toEqual({
      $type: 'app.bsky.richtext.facet#link',
      uri: 'https://bsky.app',
    })
    expect(segments[2]?.text).toBe(' out')
  })

  it('correctly segments a hashtag', () => {
    const text = 'I love #atproto!'
    const tagText = '#atproto'
    const byteStart = 7
    const byteEnd = byteStart + new TextEncoder().encode(tagText).length

    const record: RichTextRecord = {
      text,
      facets: [
        {
          index: { byteStart, byteEnd },
          features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'atproto' }],
        },
      ],
    }

    const segments = parseRichText(record)

    expect(segments).toHaveLength(3)
    expect(segments[1]?.text).toBe('#atproto')
    expect(segments[1]?.feature).toEqual({ $type: 'app.bsky.richtext.facet#tag', tag: 'atproto' })
  })

  it('handles multiple facets in one text', () => {
    // "Hello @alice and #bsky"
    const text = 'Hello @alice and #bsky'
    const encoder = new TextEncoder()

    const mentionStart = 6
    const mentionEnd = mentionStart + encoder.encode('@alice').length
    const tagStart = 17
    const tagEnd = tagStart + encoder.encode('#bsky').length

    const record: RichTextRecord = {
      text,
      facets: [
        {
          index: { byteStart: mentionStart, byteEnd: mentionEnd },
          features: [{ $type: 'app.bsky.richtext.facet#mention', did: 'did:plc:alice' }],
        },
        {
          index: { byteStart: tagStart, byteEnd: tagEnd },
          features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'bsky' }],
        },
      ],
    }

    const segments = parseRichText(record)

    expect(segments).toHaveLength(4)
    expect(segments[0]?.text).toBe('Hello ')
    expect(segments[1]?.text).toBe('@alice')
    expect(segments[2]?.text).toBe(' and ')
    expect(segments[3]?.text).toBe('#bsky')
  })

  it('handles multibyte (emoji) characters correctly', () => {
    // 🎉 is 4 bytes in UTF-8
    const text = '🎉 Cool!'
    const emojiBytes = new TextEncoder().encode('🎉')
    expect(emojiBytes.length).toBe(4)

    // No facets — should reconstruct faithfully
    const segments = parseRichText({ text })
    expect(segments).toHaveLength(1)
    expect(segments[0]?.text).toBe('🎉 Cool!')
  })

  it('gracefully skips malformed facets with reversed byte indices', () => {
    const record: RichTextRecord = {
      text: 'Hello world',
      facets: [
        {
          index: { byteStart: 5, byteEnd: 2 }, // reversed — invalid
          features: [{ $type: 'app.bsky.richtext.facet#tag', tag: 'bad' }],
        },
      ],
    }
    const segments = parseRichText(record)
    expect(segments).toEqual([{ text: 'Hello world' }])
  })

  it('gracefully skips out-of-bounds facets', () => {
    const record: RichTextRecord = {
      text: 'Hi',
      facets: [
        {
          index: { byteStart: 10, byteEnd: 20 }, // beyond text length
          features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://x.com' }],
        },
      ],
    }
    const segments = parseRichText(record)
    expect(segments).toEqual([{ text: 'Hi' }])
  })
})
