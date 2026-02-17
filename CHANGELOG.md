# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.2] — 2026-02-17

### Fixed

- **`localsInner` crash in Next.js / SSR apps (root-cause fix)** — the real source of the `Cannot read properties of undefined (reading 'localsInner')` crash is a **ProseMirror module-duplication** problem, not an SSR-timing issue. When `@tiptap/*` and `prosemirror-*` packages were bundled inside the library output, a consumer's app could end up with two separate copies of `prosemirror-view` in the same page. ProseMirror's `DecorationGroup` instances from different copies are incompatible, causing the crash. The fix is to mark all `@tiptap/*`, `prosemirror-*`, `tippy.js`, and `@atproto/api` imports as **external** in the build config so the consumer's bundler resolves them to a single, deduplicated copy. As a result, the ESM bundle size dropped from ~190 KB to ~25 KB. ([ueberdosis/tiptap#3869](https://github.com/ueberdosis/tiptap/issues/3869), [#5074](https://github.com/ueberdosis/tiptap/issues/5074))
- All externalized packages are also now listed under `peerDependencies` so package managers can detect and warn on version mismatches.

---

## [1.0.1] — 2026-02-17

### Fixed

- **`<RichTextEditor>`** — added `immediatelyRender: false` to the internal `useEditor` call to prevent the `Cannot read properties of undefined (reading 'localsInner')` crash when rendering in SSR environments (Next.js, Remix, etc.). The editor now defers DOM initialisation until after the component mounts on the client. ([#5856](https://github.com/ueberdosis/tiptap/issues/5856))

---

## [1.0.0] — 2026-02-17

First stable release. 🎉

### Added

#### Components

- **`<RichTextDisplay>`** — renders AT Protocol `{ text, facets }` records as interactive HTML
  - Supports `app.bsky.richtext.facet#mention`, `#link`, and `#tag` facet types
  - Default renderers link mentions to `bsky.app/profile`, hashtags to `bsky.app/hashtag`
  - `renderMention`, `renderLink`, `renderTag` render props for fully custom output
  - `mentionUrl`, `tagUrl`, `linkUrl` props for custom URL generation without replacing the full renderer
  - `classNames` prop for targeted CSS class overrides (works with `generateClassNames()`)
  - `disableLinks` prop to render all facets as plain text
  - `linkProps` forwarded to every default `<a>` element
  - Handles UTF-8 byte-offset arithmetic for multi-byte and emoji text

- **`<RichTextEditor>`** — TipTap-based WYSIWYG editor for composing AT Protocol richtext
  - Built-in @mention autocomplete powered by the **Bluesky public API** (no auth required)
  - Mention search is debounced (default 300 ms, configurable via `mentionSearchDebounceMs`)
  - `onMentionQuery` prop to supply a custom search function (overrides the default)
  - `disableDefaultMentionSearch` prop to disable the built-in search entirely
  - URL decoration using a **stateless ProseMirror `DecorationSet`** (no stateful marks — URLs end cleanly when followed by a space)
  - Hard-break (Shift+Enter) support
  - Undo / redo history
  - `onChange` emits a `RichTextRecord` with facets populated via `detectFacetsWithoutResolution()`
  - `classNames` prop for deep-customisable styling (use `generateClassNames()`)
  - Imperative `editorRef` API: `focus()`, `blur()`, `clear()`, `getText()`
  - `editable` prop to toggle read-only mode
  - Paste handler strips HTML formatting and inserts plain text

- **`<MentionSuggestionList>`** — default @mention autocomplete dropdown
  - Avatar image support with initial-letter fallback
  - `classNames` prop for full visual customisation
  - `showAvatars` and `noResultsText` convenience props
  - Keyboard navigation: ↑ / ↓ to move, Enter / Tab to select, Escape to dismiss
  - Exported for use as a reference or reuse in custom popup implementations

#### Utilities

- **`generateClassNames(classNamesArray, cn?)`** — deep-merge utility for classNames objects
  - Array API: pass multiple partial classNames objects merged left-to-right
  - Later entries override earlier ones; strings at the same key are combined
  - Recursively merges nested objects (e.g. `EditorClassNames.suggestion`)
  - Falsy array entries (`undefined`, `null`, `false`) are silently skipped — enables clean conditional overrides
  - Optional `cn` parameter accepts any class utility (`clsx`, `tailwind-merge`, etc.)

- **`searchBskyActors(query, limit?)`** — query the Bluesky public search API
  - Unauthenticated, no API key required
  - Returns an array of `MentionSuggestion` objects
  - Fails gracefully (returns `[]`) on network errors or empty queries

- **`createDebouncedSearch(delayMs?)`** — create a debounced wrapper around `searchBskyActors`
  - All pending callers during the debounce window receive the same result
  - Default delay: 300 ms

- **`useRichText(record)`** — low-level hook that parses `RichTextRecord` into `RichTextSegment[]`

- **`parseRichText(record)`** — synchronous parser (non-hook variant)

- **`toShortUrl(url, maxLength?)`** — display-friendly URL shortener (strips protocol, truncates)

- **`isValidUrl(url)`** — URL validation utility

#### Types

- `RichTextRecord`, `Facet`, `ByteSlice`
- `MentionFeature`, `LinkFeature`, `TagFeature`, `FacetFeature`
- `RichTextSegment`
- `DisplayClassNames`, `EditorClassNames`, `SuggestionClassNames`
- `MentionSuggestion`, `RichTextEditorRef`
- `ClassNameFn`

#### Type guards

- `isMentionFeature()`, `isLinkFeature()`, `isTagFeature()`

#### Default classNames objects

- `defaultDisplayClassNames` — starting point for `<RichTextDisplay>` styling
- `defaultEditorClassNames` — starting point for `<RichTextEditor>` styling
- `defaultSuggestionClassNames` — starting point for `<MentionSuggestionList>` styling

#### CSS

- `styles.css` — structural-only (layout, box-sizing, word-break) — no colours or fonts
- Class-based selectors: `.bsky-richtext`, `.bsky-mention`, `.bsky-editor`, `.bsky-suggestions`, etc.

---

[1.0.1]: https://github.com/satyam-mishra-pce/bsky-richtext-react/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/satyam-mishra-pce/bsky-richtext-react/releases/tag/v1.0.0
