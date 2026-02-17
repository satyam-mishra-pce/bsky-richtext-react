import { describe, it, expect } from 'vitest'
import { generateClassNames } from './classNames'
import type { DisplayClassNames, EditorClassNames, SuggestionClassNames } from '../types/classNames'
import {
  defaultDisplayClassNames,
  defaultEditorClassNames,
  defaultSuggestionClassNames,
} from '../defaults/classNames'

describe('generateClassNames', () => {
  // ─── Empty / falsy inputs ──────────────────────────────────────────────────

  it('returns empty object for empty array', () => {
    expect(generateClassNames([])).toEqual({})
  })

  it('filters out falsy entries (undefined, null, false)', () => {
    const result = generateClassNames<DisplayClassNames>([undefined, null, false, { root: 'a' }])
    expect(result).toEqual({ root: 'a' })
  })

  it('returns empty object when all entries are falsy', () => {
    expect(generateClassNames([undefined, null, false])).toEqual({})
  })

  // ─── Single object passthrough ─────────────────────────────────────────────

  it('returns a copy of the single object when only one is provided', () => {
    const input: DisplayClassNames = { root: 'r', mention: 'm' }
    const result = generateClassNames([input])
    expect(result).toEqual({ root: 'r', mention: 'm' })
    // Should be a new object, not the same reference
    expect(result).not.toBe(input)
  })

  // ─── String merging ────────────────────────────────────────────────────────

  it('joins string values with a space by default', () => {
    const result = generateClassNames<DisplayClassNames>([{ root: 'a' }, { root: 'b' }])
    expect(result.root).toBe('a b')
  })

  it('uses the provided cn function instead of space-join', () => {
    const cn = (...args: Array<string | undefined | null | false>) =>
      args.filter(Boolean).join(' | ')

    const result = generateClassNames<DisplayClassNames>([{ root: 'a' }, { root: 'b' }], cn)
    expect(result.root).toBe('a | b')
  })

  it('skips empty strings when merging', () => {
    const result = generateClassNames<DisplayClassNames>([{ root: '' }, { root: 'b' }])
    expect(result.root).toBe('b')
  })

  it('handles keys present in only one object', () => {
    const result = generateClassNames<DisplayClassNames>([{ root: 'r' }, { mention: 'm' }])
    expect(result.root).toBe('r')
    expect(result.mention).toBe('m')
  })

  // ─── Real defaults merging ─────────────────────────────────────────────────

  it('merges a single override on top of default display classNames', () => {
    const result = generateClassNames<DisplayClassNames>([
      defaultDisplayClassNames,
      { mention: 'font-bold' },
    ])
    // default mention class + override appended
    expect(result.mention).toBe(`${defaultDisplayClassNames.mention} font-bold`)
    // unchanged keys come through untouched
    expect(result.root).toBe(defaultDisplayClassNames.root)
    expect(result.link).toBe(defaultDisplayClassNames.link)
    expect(result.tag).toBe(defaultDisplayClassNames.tag)
  })

  it('applies three layers: defaults → theme → local override', () => {
    const theme: Partial<DisplayClassNames> = { root: 'dark-mode' }
    const local: Partial<DisplayClassNames> = { root: 'compact' }

    const result = generateClassNames([defaultDisplayClassNames, theme, local])
    // All three merged in order
    expect(result.root).toBe(`${defaultDisplayClassNames.root} dark-mode compact`)
  })

  // ─── Conditional entries ───────────────────────────────────────────────────

  it('supports conditional entries using falsy shorthand', () => {
    const isDark = false
    const isCompact = true

    const result = generateClassNames<DisplayClassNames>([
      defaultDisplayClassNames,
      isDark && { root: 'dark' },
      isCompact && { root: 'compact' },
    ])
    // isDark is false (skipped), isCompact is true
    expect(result.root).toBe(`${defaultDisplayClassNames.root} compact`)
  })

  // ─── Deep nested merge (EditorClassNames.suggestion) ──────────────────────

  it('recursively merges nested classNames objects', () => {
    const result = generateClassNames<EditorClassNames>([
      defaultEditorClassNames,
      { suggestion: { item: 'px-3 py-2' } },
    ])

    // Top-level keys unaffected
    expect(result.root).toBe(defaultEditorClassNames.root)

    // Nested: item should be merged
    expect(result.suggestion?.item).toBe(`${defaultSuggestionClassNames.item} px-3 py-2`)

    // Other nested keys unchanged
    expect(result.suggestion?.root).toBe(defaultSuggestionClassNames.root)
    expect(result.suggestion?.handle).toBe(defaultSuggestionClassNames.handle)
  })

  it('recursively merges multiple levels of nested overrides', () => {
    const layer1: Partial<EditorClassNames> = {
      suggestion: { item: 'layer1-item' },
    }
    const layer2: Partial<EditorClassNames> = {
      suggestion: { item: 'layer2-item', itemSelected: 'selected' },
    }

    const result = generateClassNames([defaultEditorClassNames, layer1, layer2])

    expect(result.suggestion?.item).toBe(
      `${defaultSuggestionClassNames.item} layer1-item layer2-item`,
    )
    expect(result.suggestion?.itemSelected).toBe(
      `${defaultSuggestionClassNames.itemSelected} selected`,
    )
  })

  it('handles a standalone SuggestionClassNames merge', () => {
    const result = generateClassNames<SuggestionClassNames>([
      defaultSuggestionClassNames,
      { root: 'shadow-xl', itemSelected: 'bg-blue-100' },
    ])

    expect(result.root).toBe(`${defaultSuggestionClassNames.root} shadow-xl`)
    expect(result.itemSelected).toBe(`${defaultSuggestionClassNames.itemSelected} bg-blue-100`)
    expect(result.item).toBe(defaultSuggestionClassNames.item)
  })

  // ─── Custom cn function with real tailwind-merge-like deduplication ────────

  it('allows a cn function that deduplicates conflicting classes', () => {
    // Simple deduplicator: last class wins for conflicting prefixes
    const twMerge = (...args: Array<string | undefined | null | false>) => {
      const classes = args.filter(Boolean).join(' ').split(' ').filter(Boolean)
      // Deduplicate by keeping last occurrence
      const seen = new Map<string, string>()
      for (const cls of classes) {
        const prefix = cls.split('-')[0] ?? cls
        seen.set(prefix, cls)
      }
      return [...seen.values()].join(' ')
    }

    const result = generateClassNames<DisplayClassNames>(
      [{ root: 'p-2' }, { root: 'p-4' }],
      twMerge,
    )
    // p-4 should win since twMerge deduplicates by prefix
    expect(result.root).toBe('p-4')
  })

  // ─── Edge cases ────────────────────────────────────────────────────────────

  it('ignores undefined values for a key when other objects define it', () => {
    const result = generateClassNames<DisplayClassNames>([
      { root: 'base' },
      { root: undefined, mention: 'mention-class' },
    ])
    expect(result.root).toBe('base')
    expect(result.mention).toBe('mention-class')
  })

  it('handles a fully empty override object gracefully', () => {
    const result = generateClassNames<DisplayClassNames>([defaultDisplayClassNames, {}])
    expect(result).toEqual(defaultDisplayClassNames)
  })
})
