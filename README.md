# bsky-richtext-react

> React components for rendering and editing [Bluesky](https://bsky.app) richtext content — the [`app.bsky.richtext.facet`](https://atproto.com/lexicons/app-bsky-richtext) AT Protocol lexicon.

---

## Features

- **`RichTextDisplay`** — Render AT Protocol richtext records (`text` + `facets`) as interactive HTML. Supports @mentions, links, and #hashtags with fully customizable renderers.
- **`RichTextEditor`** — TipTap-based WYSIWYG editor with real-time @mention autocomplete, URL decoration, undo/redo, and an imperative ref API.
- **`useRichText`** — Low-level hook to parse `{ text, facets }` into segments.
- **Headless by design** — Ships with layout-only CSS. You style it.
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

### Peer dependencies

```bash
bun add react react-dom
```

---

## Quick Start

### Display richtext

```tsx
import { RichTextDisplay } from 'bsky-richtext-react'
import 'bsky-richtext-react/styles.css' // optional structural styles

// From an AT Protocol post record
const post = {
  text: 'Hello @alice.bsky.social! Check out #atproto at https://atproto.com',
  facets: [
    /* ... facets from the API ... */
  ],
}

export function Post() {
  return <RichTextDisplay value={post} />
}
```

### Edit richtext

```tsx
import { RichTextEditor } from 'bsky-richtext-react'
import 'bsky-richtext-react/styles.css'

export function Composer() {
  return (
    <RichTextEditor
      placeholder="What's on your mind?"
      onMentionQuery={async (query) => {
        // Call your AT Protocol agent to search profiles
        const results = await agent.searchActors({ term: query, limit: 8 })
        return results.actors.map((a) => ({
          did: a.did,
          handle: a.handle,
          displayName: a.displayName,
          avatarUrl: a.avatar,
        }))
      }}
      onChange={(record) => {
        // `record.text` is the plain text
        // `record.facets` will be populated in a future version
        console.log(record)
      }}
    />
  )
}
```

---

## API Reference

### `<RichTextDisplay>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `RichTextRecord \| string` | — | The richtext to render |
| `renderMention` | `(props: MentionProps) => ReactNode` | Default `<a>` | Custom mention renderer |
| `renderLink` | `(props: LinkProps) => ReactNode` | Default `<a>` | Custom link renderer |
| `renderTag` | `(props: TagProps) => ReactNode` | Default `<a>` | Custom hashtag renderer |
| `disableLinks` | `boolean` | `false` | Render all facets as plain text |
| `linkProps` | `AnchorHTMLAttributes` | — | Props forwarded to default `<a>` elements |
| `...spanProps` | `HTMLAttributes<HTMLSpanElement>` | — | Forwarded to root `<span>` |

### `<RichTextEditor>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialValue` | `RichTextRecord \| string` | — | Initial content (uncontrolled) |
| `onChange` | `(record: RichTextRecord) => void` | — | Called on every change |
| `placeholder` | `string` | — | Placeholder text |
| `onFocus` | `() => void` | — | Called when editor gains focus |
| `onBlur` | `() => void` | — | Called when editor loses focus |
| `onMentionQuery` | `(query: string) => Promise<MentionSuggestion[]>` | — | Fetch @mention suggestions |
| `renderMentionSuggestion` | `SuggestionOptions['render']` | — | Custom suggestion dropdown factory |
| `editorRef` | `Ref<RichTextEditorRef>` | — | Imperative ref |
| `editable` | `boolean` | `true` | Toggle editable state |
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

### `useRichText(record: RichTextRecord): RichTextSegment[]`

Low-level hook. Parses a `RichTextRecord` into an array of segments:

```ts
interface RichTextSegment {
  text: string
  feature?: MentionFeature | LinkFeature | TagFeature
}
```

---

## Types

All AT Protocol facet types are exported:

```ts
import type {
  RichTextRecord,   // { text: string; facets?: Facet[] }
  Facet,            // { index: ByteSlice; features: FacetFeature[] }
  ByteSlice,        // { byteStart: number; byteEnd: number }
  MentionFeature,   // { $type: 'app.bsky.richtext.facet#mention'; did: string }
  LinkFeature,      // { $type: 'app.bsky.richtext.facet#link'; uri: string }
  TagFeature,       // { $type: 'app.bsky.richtext.facet#tag'; tag: string }
  FacetFeature,     // MentionFeature | LinkFeature | TagFeature
} from 'bsky-richtext-react'
```

Type guards:

```ts
import { isMentionFeature, isLinkFeature, isTagFeature } from 'bsky-richtext-react'
```

---

## Styling

Import the optional structural CSS to get layout-correct rendering:

```ts
import 'bsky-richtext-react/styles.css'
```

This only sets `display`, `word-break`, and `box-sizing` rules. **No colors, fonts, or borders are applied.** Style everything else yourself:

```css
/* Example: style mentions */
[data-bsky-mention] a {
  color: #0085ff;
  text-decoration: none;
  font-weight: 600;
}

/* Example: style the editor */
[data-bsky-richtext-editor] .ProseMirror {
  padding: 12px 16px;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.5;
  min-height: 120px;
}
```

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

## AT Protocol Background

Richtext in AT Protocol is represented as a plain UTF-8 string (`text`) paired with an array of `facets`. Each facet maps a **byte range** (not a character range!) of the text to a semantic feature:

| Feature | `$type` | Description |
|---------|---------|-------------|
| Mention | `app.bsky.richtext.facet#mention` | Reference to another account (DID) |
| Link | `app.bsky.richtext.facet#link` | Hyperlink (full URI) |
| Tag | `app.bsky.richtext.facet#tag` | Hashtag (without `#`) |

> ⚠️ Byte offsets are **UTF-8**, but JavaScript strings are **UTF-16**. This library handles the conversion for you via the `sliceByByteOffset` utility.

Full lexicon: [`lexicons/app/richtext/facet.json`](./lexicons/app/richtext/facet.json)

---

## License

MIT © 2026
