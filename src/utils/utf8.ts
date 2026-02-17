/**
 * UTF-8 byte offset utilities.
 *
 * The AT Protocol richtext spec uses UTF-8 byte offsets for facet indices,
 * but JavaScript strings are UTF-16. These helpers bridge that gap.
 *
 * Reference: https://atproto.com/specs/richtext
 */

const encoder = new TextEncoder()

/**
 * Encode a string to a UTF-8 byte array.
 */
export function toUtf8Bytes(text: string): Uint8Array {
  return encoder.encode(text)
}

/**
 * Convert a UTF-8 byte offset to a JavaScript (UTF-16) string index.
 * Needed when slicing a JS string using AT Protocol byte offsets.
 */
export function utf8ByteOffsetToCharIndex(text: string, byteOffset: number): number {
  const bytes = encoder.encode(text)
  // Decode only up to the byte offset, then measure the resulting string length
  const decoder = new TextDecoder()
  const slice = bytes.slice(0, byteOffset)
  return decoder.decode(slice).length
}

/**
 * Slice a string using UTF-8 byte offsets (inclusive start, exclusive end).
 */
export function sliceByByteOffset(text: string, byteStart: number, byteEnd: number): string {
  const startChar = utf8ByteOffsetToCharIndex(text, byteStart)
  const endChar = utf8ByteOffsetToCharIndex(text, byteEnd)
  return text.slice(startChar, endChar)
}

/**
 * Get the UTF-8 byte length of a string.
 */
export function utf8ByteLength(text: string): number {
  return encoder.encode(text).length
}
