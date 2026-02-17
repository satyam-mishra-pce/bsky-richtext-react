// Extend Vitest's expect with jest-dom matchers
// e.g. expect(element).toBeInTheDocument()
import '@testing-library/jest-dom'

// ─── ProseMirror / jsdom compatibility stubs ─────────────────────────────────
// ProseMirror relies on layout APIs (elementFromPoint, getClientRects) that
// jsdom does not implement. Stub them so tests don't crash.

if (typeof document !== 'undefined') {
  // elementFromPoint — used by ProseMirror's mouse event handler
  if (!document.elementFromPoint) {
    document.elementFromPoint = () => null
  }

  // getClientRects — ProseMirror calls this on text nodes for caret positioning
  const originalCreateElement = document.createElement.bind(document)
  // Patch Element.prototype if not already present
  if (!Element.prototype.getClientRects) {
    Element.prototype.getClientRects = () => [] as unknown as DOMRectList
  }
  if (!Element.prototype.getBoundingClientRect) {
    Element.prototype.getBoundingClientRect = () => ({
      top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0,
      toJSON: () => ({}),
    })
  }
  void originalCreateElement // suppress unused warning
}

// Patch Range.prototype for ProseMirror text node getClientRects calls
if (typeof Range !== 'undefined') {
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList
  }
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () => ({
      top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0, x: 0, y: 0,
      toJSON: () => ({}),
    })
  }
}
