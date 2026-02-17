/**
 * URL display utilities for richtext rendering.
 */

/**
 * Shorten a URL for display purposes — strips the protocol and truncates
 * the path if it's very long (mirrors Bluesky's `toShortUrl` behaviour).
 *
 * @example
 * toShortUrl('https://example.com/some/very/long/path?q=foo')
 * // => 'example.com/some/very/long/path?q=foo'
 */
export function toShortUrl(url: string, maxLength = 30): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    const rest = parsed.pathname + parsed.search + parsed.hash

    const full = host + (rest === '/' ? '' : rest)
    if (full.length <= maxLength) return full

    return full.slice(0, maxLength) + '…'
  } catch {
    // Not a valid URL — return as-is
    return url
  }
}

/**
 * Validate that a string is a well-formed URL.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
