# bsky-richtext-react

> React components for rendering and editing [Bluesky](https://bsky.app) richtext content — the [`app.bsky.richtext.facet`](https://atproto.com/lexicons/app-bsky-richtext) AT Protocol lexicon.

[![npm version](https://img.shields.io/npm/v/bsky-richtext-react.svg)](https://www.npmjs.com/package/bsky-richtext-react)
[![CI](https://github.com/satyam-mishra-pce/bsky-richtext-react/actions/workflows/ci.yml/badge.svg)](https://github.com/satyam-mishra-pce/bsky-richtext-react/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/bsky-richtext-react)](https://bundlephobia.com/package/bsky-richtext-react)

---

## Features

- **`<RichTextDisplay>`** — Render AT Protocol richtext records (`text` + `facets`) as interactive HTML. Handles @mentions, links, and #hashtags with fully customisable renderers and URL resolvers.
- **`<RichTextEditor>`** — TipTap-based editor with real-time @mention autocomplete (powered by the **Bluesky public API** by default — no auth required), stateless URL decoration, undo/redo, and an imperative ref API.
- **`generateClassNames()`** — Deep-merge utility for the `classNames` prop system. Pass an array of partial classNames objects and get one merged result, optionally using your own `cn()` / `clsx` / `tailwind-merge` utility.
- **Headless by design** — Ships with layout-only CSS. Bring your own colours, fonts, and borders.
- **Fully typed** — TypeScript-first with complete type definitions for all AT Protocol facet types.
- **Tree-shakeable** — ESM + CJS dual build via `tsup`.

---

## Installation

```bash
# bun (recommended)
bun add bsky-richtext-react

# npm
npm install bsky-richtext-react

# pnpm
pnpm add bsky-richtext-react
```

Peer dependencies (if not already installed):

```bash
bun add react react-dom
```

---

## Quick Start

### Rendering a post

```tsx
import { RichTextDisplay } from 'bsky-richtext-react'
import 'bsky-richtext-react/styles.css'

// Pass raw fields from an app.bsky.feed.post record
export function Post({ post }) {
  return <RichTextDisplay value={{ text: post.text, facets: post.facets }} />
}
```

### Composing a post

```tsx
import { RichTextEditor } from 'bsky-richtext-react'
import 'bsky-richtext-react/styles.css'

export function Composer() {
  return (
    <RichTextEditor
      placeholder="What's on your mind?"
      onChange={(record) => {
        // record.text  — plain UTF-8 text
        // record.facets — mentions (as handles), links, hashtags
        console.log(record)
      }}
    />
  )
}
```

> **The editor uses the Bluesky public API for @mention search by default.** Type `@` followed by a handle to see live suggestions — no API key or authentication required. See [Mention Search](#mention-search) to customise or disable this.

---

## Styling

### 1. Import the structural CSS

```ts
import 'bsky-richtext-react/styles.css'
```

This only sets `display`, `word-break`, `box-sizing`, and flex layout rules. **No colours, fonts, or borders are applied.** You control all visual styling.

### 2. Target the default class names

Every element rendered by the components carries a predictable CSS class that you can target directly:

#### `<RichTextDisplay>`

| Class | Element |
|-------|---------|
| `.bsky-richtext` | Root `<span>` |
| `.bsky-mention` | @mention `<a>` |
| `.bsky-link` | Link `<a>` |
| `.bsky-tag` | #hashtag `<a>` |

#### `<RichTextEditor>`

| Class | Element |
|-------|---------|
| `.bsky-editor` | Root wrapper `<div>` |
| `.bsky-editor-content` | ProseMirror wrapper |
| `.bsky-editor-mention` | Mention chip inside editor |
| `.autolink` | URL decoration span inside editor |

#### `<MentionSuggestionList>` (dropdown)

| Class | Element |
|-------|---------|
| `.bsky-suggestions` | Outer container |
| `.bsky-suggestion-item` | Each suggestion row (`<button>`) |
| `.bsky-suggestion-item-selected` | Currently highlighted row |
| `.bsky-suggestion-avatar` | Avatar wrapper |
| `.bsky-suggestion-avatar-img` | `<img>` element |
| `.bsky-suggestion-avatar-placeholder` | Initial-letter fallback |
| `.bsky-suggestion-text` | Text column (name + handle) |
| `.bsky-suggestion-name` | Display name |
| `.bsky-suggestion-handle` | `@handle` |
| `.bsky-suggestion-empty` | "No results" message |

```css
/* Example: style the editor */
.bsky-editor .ProseMirror {
  padding: 12px 16px;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.5;
  min-height: 120px;
}

/* Example: style mentions in a post */
.bsky-mention {
  color: #0085ff;
  font-weight: 600;
  text-decoration: none;
}
.bsky-mention:hover { text-decoration: underline; }

/* Example: style the suggestion dropdown */
.bsky-suggestions {
  background: #fff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  min-width: 240px;
  padding: 4px;
}
.bsky-suggestion-item { padding: 8px 10px; border-radius: 6px; }
.bsky-suggestion-item-selected { background: #f0f4ff; }
```

### 3. Use `generateClassNames()` for targeted overrides

The `classNames` prop on each component accepts a nested object. Use `generateClassNames()` to cleanly layer your classes on top of the defaults without rewriting them from scratch:

```tsx
import {
  RichTextEditor,
  generateClassNames,
  defaultEditorClassNames,
} from 'bsky-richtext-react'

// Works with any class utility — clsx, tailwind-merge, your own cn()
import { cn } from '@/lib/utils'

<RichTextEditor
  classNames={generateClassNames([
    defaultEditorClassNames,
    {
      root: 'border rounded-lg p-3 focus-within:ring-2',
      mention: 'text-blue-500 font-semibold',
      suggestion: {
        item: 'px-3 py-2 rounded-md',
        itemSelected: 'bg-blue-50',
      },
    },
  ], cn)}
/>
```

`generateClassNames()` accepts any number of partial classNames objects in the array. Entries are merged left-to-right; strings at the same key are combined using `cn()`. **Falsy entries are skipped**, so conditional overrides work naturally:

```tsx
classNames={generateClassNames([
  defaultEditorClassNames,
  isCompact && { root: 'text-sm p-2' },
  isDark   && darkThemeClassNames,
], cn)}
```

#### Opting out of defaults

Pass a plain object to skip the defaults entirely:

```tsx
<RichTextDisplay classNames={{ root: 'my-text', mention: 'my-mention' }} />
```

### 4. Tailwind integration

```tsx
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

const cn = (...inputs) => twMerge(clsx(inputs))

<RichTextEditor
  classNames={generateClassNames([
    defaultEditorClassNames,
    { root: 'rounded-xl border border-gray-200 p-4' },
  ], cn)}
/>
```

---

## API Reference

### `<RichTextDisplay>`

```tsx
import { RichTextDisplay } from 'bsky-richtext-react'

<RichTextDisplay value={post} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `RichTextRecord \| string` | — | The richtext to render |
| `classNames` | `Partial<DisplayClassNames>` | defaults | CSS class names for styling (use `generateClassNames()`) |
| `renderMention` | `(props: MentionProps) => ReactNode` | `<a>` to bsky.app | Custom @mention renderer |
| `renderLink` | `(props: LinkProps) => ReactNode` | `<a>` with short URL | Custom link renderer |
| `renderTag` | `(props: TagProps) => ReactNode` | `<a>` to bsky.app | Custom #hashtag renderer |
| `mentionUrl` | `(did: string) => string` | `https://bsky.app/profile/${did}` | Generate @mention `href` |
| `tagUrl` | `(tag: string) => string` | `https://bsky.app/hashtag/${tag}` | Generate #hashtag `href` |
| `linkUrl` | `(uri: string) => string` | identity | Transform link `href` (e.g. proxy URLs) |
| `disableLinks` | `boolean` | `false` | Render all facets as plain text |
| `linkProps` | `AnchorHTMLAttributes` | — | Forwarded to every default `<a>` |
| `...spanProps` | `HTMLAttributes<HTMLSpanElement>` | — | Forwarded to root `<span>` |

#### Custom routing example

```tsx
// Point mentions and hashtags to your own app routes
<RichTextDisplay
  value={post}
  mentionUrl={(did) => `/profile/${did}`}
  tagUrl={(tag) => `/search?tag=${encodeURIComponent(tag)}`}
/>
```

#### Custom renderer example

```tsx
import { Link } from 'react-router-dom'

<RichTextDisplay
  value={post}
  renderMention={({ text, did }) => (
    <Link to={`/profile/${did}`} className="mention">{text}</Link>
  )}
/>
```

---

### `<RichTextEditor>`

```tsx
import { RichTextEditor } from 'bsky-richtext-react'

<RichTextEditor
  placeholder="What's on your mind?"
  onChange={(record) => setPost(record)}
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialValue` | `RichTextRecord \| string` | — | Initial content (uncontrolled) |
| `onChange` | `(record: RichTextRecord) => void` | — | Called on every content change |
| `placeholder` | `string` | — | Placeholder text when empty |
| `onFocus` | `() => void` | — | Called when editor gains focus |
| `onBlur` | `() => void` | — | Called when editor loses focus |
| `classNames` | `Partial<EditorClassNames>` | defaults | CSS class names for styling (use `generateClassNames()`) |
| `onMentionQuery` | `(query: string) => Promise<MentionSuggestion[]>` | **Bluesky public API** | Custom mention search. Overrides the built-in search. |
| `mentionSearchDebounceMs` | `number` | `300` | Debounce delay (ms) for the built-in search. No effect when `onMentionQuery` is set. |
| `disableDefaultMentionSearch` | `boolean` | `false` | Disable the built-in Bluesky API search entirely |
| `renderMentionSuggestion` | `SuggestionOptions['render']` | tippy.js popup | Custom TipTap suggestion renderer factory |
| `mentionSuggestionOptions` | `DefaultSuggestionRendererOptions` | — | Options forwarded to the default renderer |
| `editorRef` | `Ref<RichTextEditorRef>` | — | Imperative ref |
| `editable` | `boolean` | `true` | Toggle read-only mode |
| `...divProps` | `HTMLAttributes<HTMLDivElement>` | — | Forwarded to root `<div>` |

#### `RichTextEditorRef`

```ts
interface RichTextEditorRef {
  focus(): void
  blur(): void
  clear(): void
  getText(): string
}
```

```tsx
const editorRef = useRef<RichTextEditorRef>(null)

editorRef.current?.focus()
editorRef.current?.clear()
const text = editorRef.current?.getText()
```

#### Mention Search

The editor searches Bluesky actors **by default** when the user types `@`:

```tsx
// Built-in: uses https://public.api.bsky.app, debounced 300ms
<RichTextEditor placeholder="Type @ to search…" />

// Custom debounce
<RichTextEditor mentionSearchDebounceMs={500} />

// Your own search (e.g. from an authenticated agent)
<RichTextEditor
  onMentionQuery={async (query) => {
    const res = await agent.searchActors({ term: query, limit: 8 })
    return res.data.actors.map((a) => ({
      did: a.did,
      handle: a.handle,
      displayName: a.displayName,
      avatarUrl: a.avatar,
    }))
  }}
/>

// Disable built-in search (no suggestions unless you set onMentionQuery)
<RichTextEditor disableDefaultMentionSearch />
```

---

### `<MentionSuggestionList>`

The default suggestion dropdown rendered inside the tippy.js popup. Exported so you can reuse or reference it in your own popup implementation.

```tsx
import { MentionSuggestionList } from 'bsky-richtext-react'
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `MentionSuggestion[]` | — | Suggestion items (from TipTap) |
| `command` | `SuggestionCommand` | — | TipTap command to insert selected item |
| `classNames` | `Partial<SuggestionClassNames>` | defaults | CSS class names for styling |
| `showAvatars` | `boolean` | `true` | Show / hide avatar images |
| `noResultsText` | `string` | `"No results"` | Empty-state message |

---

### `useRichText(record)`

Low-level hook. Parses a `RichTextRecord` into an array of typed segments.

```ts
import { useRichText } from 'bsky-richtext-react'

const segments = useRichText({ text: post.text, facets: post.facets })
// => [{ text: 'Hello ', feature: undefined }, { text: '@alice', feature: MentionFeature }, ...]
```

```ts
interface RichTextSegment {
  text: string
  feature?: MentionFeature | LinkFeature | TagFeature
}
```

---

## Utilities

### `generateClassNames(classNamesArray, cn?)`

Deep-merge an array of partial classNames objects into one. String values at the same key are combined (space-joined or via `cn()`). Nested objects are merged recursively. Falsy entries are skipped.

```ts
import {
  generateClassNames,
  defaultEditorClassNames,
  defaultDisplayClassNames,
  defaultSuggestionClassNames,
} from 'bsky-richtext-react'
```

```ts
// Merge defaults with overrides
const classNames = generateClassNames([
  defaultEditorClassNames,
  { root: 'my-editor', mention: 'text-blue-500' },
])

// Deep nested override
const classNames = generateClassNames([
  defaultEditorClassNames,
  { suggestion: { item: 'px-3 py-2', itemSelected: 'bg-blue-50' } },
])

// Conditional entries (falsy values are ignored)
const classNames = generateClassNames([
  defaultEditorClassNames,
  isCompact && { root: 'text-sm' },
  isDark    && darkThemeClassNames,
])

// With a class utility for deduplication
import { cn } from '@/lib/utils'
const classNames = generateClassNames([defaultEditorClassNames, overrides], cn)
```

**Signature:**
```ts
function generateClassNames<T extends object>(
  classNamesArray: (Partial<T> | undefined | null | false)[],
  cn?: (...inputs: (string | undefined | null | false)[]) => string,
): T
```

---

### `searchBskyActors(query, limit?)`

Fetch actor suggestions from the Bluesky public API. No authentication required.

```ts
import { searchBskyActors } from 'bsky-richtext-react'

const suggestions = await searchBskyActors('alice', 8)
// => [{ did, handle, displayName?, avatarUrl? }, ...]
```

Returns `[]` on empty query, network error, or non-OK response.

---

### `createDebouncedSearch(delayMs?)`

Create a debounced wrapper around `searchBskyActors`. Rapid calls within the window are coalesced — only the last query fires a network request, but all pending callers receive the result.

```ts
import { createDebouncedSearch } from 'bsky-richtext-react'

const debouncedSearch = createDebouncedSearch(400)

// Use as onMentionQuery
<RichTextEditor onMentionQuery={debouncedSearch} />
```

---

### Other utilities

```ts
import { toShortUrl, isValidUrl, parseRichText } from 'bsky-richtext-react'

toShortUrl('https://example.com/some/long/path?q=1')
// => 'example.com/some/long/path?q=1'

isValidUrl('not a url') // => false

parseRichText({ text, facets }) // => RichTextSegment[]
```

---

## Types

All AT Protocol facet types are exported:

```ts
import type {
  RichTextRecord,    // { text: string; facets?: Facet[] }
  Facet,             // { index: ByteSlice; features: FacetFeature[] }
  ByteSlice,         // { byteStart: number; byteEnd: number }
  MentionFeature,    // { $type: 'app.bsky.richtext.facet#mention'; did: string }
  LinkFeature,       // { $type: 'app.bsky.richtext.facet#link'; uri: string }
  TagFeature,        // { $type: 'app.bsky.richtext.facet#tag'; tag: string }
  FacetFeature,      // MentionFeature | LinkFeature | TagFeature
  RichTextSegment,   // { text: string; feature?: FacetFeature }
  MentionSuggestion, // { did, handle, displayName?, avatarUrl? }
  RichTextEditorRef, // { focus, blur, clear, getText }
} from 'bsky-richtext-react'
```

ClassNames types:

```ts
import type {
  DisplayClassNames,    // { root?, mention?, link?, tag? }
  EditorClassNames,     // { root?, content?, mention?, link?, suggestion?, ... }
  SuggestionClassNames, // { root?, item?, itemSelected?, avatar?, name?, handle?, ... }
  ClassNameFn,          // (...inputs) => string — compatible with clsx/tailwind-merge
} from 'bsky-richtext-react'
```

Type guards:

```ts
import { isMentionFeature, isLinkFeature, isTagFeature } from 'bsky-richtext-react'

for (const { feature } of segments) {
  if (isMentionFeature(feature)) { /* feature.did */ }
  if (isLinkFeature(feature))    { /* feature.uri */ }
  if (isTagFeature(feature))     { /* feature.tag */ }
}
```

Default classNames objects (starting points for `generateClassNames()`):

```ts
import {
  defaultDisplayClassNames,
  defaultEditorClassNames,
  defaultSuggestionClassNames,
} from 'bsky-richtext-react'
```

---

## AT Protocol Background

Richtext in AT Protocol is represented as a plain UTF-8 string (`text`) paired with an array of `facets`. Each facet maps a **byte range** (not a character range!) of the text to a semantic feature:

| Feature | `$type` | Description |
|---------|---------|-------------|
| Mention | `app.bsky.richtext.facet#mention` | Reference to another account (DID) |
| Link | `app.bsky.richtext.facet#link` | Hyperlink (full URI) |
| Tag | `app.bsky.richtext.facet#tag` | Hashtag (without `#`) |

> ⚠️ Byte offsets are **UTF-8**, but JavaScript strings are **UTF-16**. This library handles the conversion automatically via the `sliceByByteOffset` utility.

Full lexicon: [`lexicons/app/richtext/facet.json`](./lexicons/app/richtext/facet.json)  
AT Protocol docs: [atproto.com/lexicons/app-bsky-richtext](https://atproto.com/lexicons/app-bsky-richtext)

---

## Development

```bash
# Start Storybook (component playground)
bun run dev

# Build the library
bun run build

# Run tests
bun run test

# Type-check
bun run typecheck

# Lint
bun run lint

# Format
bun run format
```

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

---

## License

MIT © 2026 [satyam-mishra-pce](https://github.com/satyam-mishra-pce)
