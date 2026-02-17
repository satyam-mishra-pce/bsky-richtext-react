/**
 * TypeScript types mirroring the `app.bsky.richtext.facet` lexicon.
 *
 * Spec: /lexicons/app/richtext/facet.json
 * Reference: https://atproto.com/lexicons/app-bsky-richtext
 */

// ─── Byte Slice ─────────────────────────────────────────────────────────────

/**
 * Specifies the sub-string range a facet feature applies to.
 * Indices are ZERO-indexed byte offsets of the UTF-8 encoded text.
 * - byteStart: inclusive
 * - byteEnd:   exclusive
 *
 * ⚠️  JavaScript strings are UTF-16. Always convert to a UTF-8 byte array
 *     before computing byte offsets.
 */
export interface ByteSlice {
  byteStart: number
  byteEnd: number
}

// ─── Facet Features ─────────────────────────────────────────────────────────

/** Mention of another AT Protocol account. The DID is the canonical identifier. */
export interface MentionFeature {
  $type: 'app.bsky.richtext.facet#mention'
  /** DID of the mentioned account */
  did: string
}

/** A hyperlink facet. The URI is the full, unshortened URL. */
export interface LinkFeature {
  $type: 'app.bsky.richtext.facet#link'
  /** The full URL */
  uri: string
}

/** A hashtag facet. The tag value does NOT include the leading '#'. */
export interface TagFeature {
  $type: 'app.bsky.richtext.facet#tag'
  /** The tag text without the '#' prefix (max 64 graphemes / 640 bytes) */
  tag: string
}

/** Union of all possible facet feature types. */
export type FacetFeature = MentionFeature | LinkFeature | TagFeature

// ─── Facet ──────────────────────────────────────────────────────────────────

/**
 * A single richtext annotation — maps a byte-range within the post text
 * to one or more semantic features (mention, link, tag).
 */
export interface Facet {
  index: ByteSlice
  features: FacetFeature[]
}

// ─── RichText Record ────────────────────────────────────────────────────────

/**
 * Represents the `text` + `facets` fields as they appear in an AT Protocol
 * record (e.g. `app.bsky.feed.post`).
 */
export interface RichTextRecord {
  text: string
  facets?: Facet[]
}

// ─── Segment ────────────────────────────────────────────────────────────────

/**
 * A parsed segment of richtext — a slice of text with its associated feature
 * (if any). Produced by the richtext parser.
 */
export interface RichTextSegment {
  /** The raw text of this segment */
  text: string
  /** The facet feature associated with this segment, if any */
  feature?: FacetFeature
}

// ─── Type Guards ────────────────────────────────────────────────────────────

export function isMentionFeature(feature: FacetFeature): feature is MentionFeature {
  return feature.$type === 'app.bsky.richtext.facet#mention'
}

export function isLinkFeature(feature: FacetFeature): feature is LinkFeature {
  return feature.$type === 'app.bsky.richtext.facet#link'
}

export function isTagFeature(feature: FacetFeature): feature is TagFeature {
  return feature.$type === 'app.bsky.richtext.facet#tag'
}
