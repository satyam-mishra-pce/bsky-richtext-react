/**
 * Richtext parser — converts `{ text, facets }` into an ordered array of
 * `RichTextSegment` objects, each with their text slice and optional feature.
 *
 * Algorithm:
 *  1. Sort facets by byteStart (ascending).
 *  2. Walk through the text byte-by-byte, emitting plain segments between
 *     facets and annotated segments for each facet's byte range.
 *  3. Overlapping facets are handled gracefully (skipped).
 */

import type { Facet, FacetFeature, RichTextRecord, RichTextSegment } from '../types/facets'
import { sliceByByteOffset, utf8ByteLength } from './utf8'

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Sort facets by their byte start position. Mutates a copy.
 */
function sortFacets(facets: Facet[]): Facet[] {
  return [...facets].sort((a, b) => a.index.byteStart - b.index.byteStart)
}

/**
 * Pick the "primary" feature from a facet's feature array.
 * The lexicon allows multiple features per facet, but for rendering we
 * pick the first valid one (mention > link > tag precedence is implicit
 * in the order they appear).
 */
function pickFeature(features: FacetFeature[]): FacetFeature | undefined {
  return features[0]
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Parse a `RichTextRecord` into an ordered array of segments, each
 * carrying its text and an optional facet feature.
 *
 * The segments are contiguous — joining all `segment.text` values
 * reconstructs the original `record.text` exactly.
 */
export function parseRichText(record: RichTextRecord): RichTextSegment[] {
  const { text, facets } = record

  if (!facets || facets.length === 0) {
    return [{ text }]
  }

  const textByteLength = utf8ByteLength(text)
  const sorted = sortFacets(facets)
  const segments: RichTextSegment[] = []

  let cursor = 0 // current byte position

  for (const facet of sorted) {
    const { byteStart, byteEnd } = facet.index

    // Skip malformed or out-of-bounds facets
    if (byteStart < cursor || byteEnd > textByteLength || byteStart >= byteEnd) {
      continue
    }

    // Emit plain text segment before this facet
    if (byteStart > cursor) {
      segments.push({
        text: sliceByByteOffset(text, cursor, byteStart),
      })
    }

    // Emit annotated segment for this facet
    const feature = pickFeature(facet.features)
    const segment: RichTextSegment = { text: sliceByByteOffset(text, byteStart, byteEnd) }
    if (feature !== undefined) segment.feature = feature
    segments.push(segment)

    cursor = byteEnd
  }

  // Emit any trailing plain text after the last facet
  if (cursor < textByteLength) {
    segments.push({
      text: sliceByByteOffset(text, cursor, textByteLength),
    })
  }

  return segments
}
