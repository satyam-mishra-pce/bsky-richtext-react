import { useMemo } from 'react'
import type { RichTextRecord, RichTextSegment } from '../types/facets'
import { parseRichText } from '../utils/parser'

/**
 * Parse a `RichTextRecord` into an array of `RichTextSegment` objects.
 *
 * The result is memoized — re-computation only occurs when `text` or the
 * serialized facets change.
 *
 * @example
 * ```tsx
 * const segments = useRichText({ text: post.text, facets: post.facets })
 * // [{ text: 'Hello ' }, { text: '@alice', feature: { $type: '...mention', did: '...' } }]
 * ```
 */
export function useRichText(record: RichTextRecord): RichTextSegment[] {
  // Stable serialization key for the facets array so useMemo can diff it
  const facetsKey = useMemo(
    () => (record.facets ? JSON.stringify(record.facets) : ''),
    [record.facets],
  )

  return useMemo(
    () => parseRichText(record),
    // record is intentionally not in deps — we only react to text+facets changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [record.text, facetsKey],
  )
}
