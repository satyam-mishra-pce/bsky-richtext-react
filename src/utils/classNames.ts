/**
 * generateClassNames — deep-merge utility for component classNames objects.
 *
 * Accepts an array of partial classNames objects and merges them left-to-right,
 * so later entries override earlier ones. String values at the same key are
 * combined using the optional `cn` function (e.g. `clsx`, `tailwind-merge`).
 * Nested objects (e.g. `suggestion` inside `EditorClassNames`) are recursively
 * merged using the same rules.
 *
 * Falsy values in the array (`undefined`, `null`, `false`) are silently
 * ignored, which makes conditional spreading ergonomic:
 *
 * @example Basic override
 * ```ts
 * import { generateClassNames, defaultEditorClassNames } from 'bsky-richtext-react'
 *
 * classNames={generateClassNames([
 *   defaultEditorClassNames,
 *   { root: 'border rounded-lg', mention: 'text-blue-500' },
 * ])}
 * ```
 *
 * @example With a Tailwind-merge / clsx utility
 * ```ts
 * import { cn } from '@/lib/utils'
 *
 * classNames={generateClassNames([
 *   defaultEditorClassNames,
 *   { root: 'rounded-none' },
 * ], cn)}
 * ```
 *
 * @example Conditional overrides
 * ```ts
 * classNames={generateClassNames([
 *   defaultEditorClassNames,
 *   isCompact && { root: 'text-sm' },
 *   isDark   && darkThemeClassNames,
 * ], cn)}
 * ```
 *
 * @example Deep nested override (suggestion dropdown)
 * ```ts
 * classNames={generateClassNames([
 *   defaultEditorClassNames,
 *   { suggestion: { item: 'hover:bg-gray-100', itemSelected: 'bg-blue-50' } },
 * ])}
 * ```
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * A function that accepts any number of class strings (plus falsy values) and
 * returns a single merged class string. Compatible with `clsx`, `classnames`,
 * and `tailwind-merge`'s `twMerge` / `cn` utilities.
 */
export type ClassNameFn = (
  ...inputs: Array<string | undefined | null | false>
) => string

// ─── Implementation ──────────────────────────────────────────────────────────

/**
 * Deep-merge an array of classNames objects into a single classNames object.
 *
 * @param classNamesArray - Objects to merge, left-to-right. Falsy entries are skipped.
 * @param cn - Optional class utility function. When omitted, strings are
 *   joined with a single space (filtering empty strings).
 */
export function generateClassNames<T extends object>(
  classNamesArray: Array<Partial<T> | undefined | null | false>,
  cn?: ClassNameFn,
): T {
  // Default merge: join non-empty strings with a space
  const merge: ClassNameFn =
    cn ?? ((...args) => args.filter(Boolean).join(' '))

  // Filter out falsy entries
  const validObjects = classNamesArray.filter(
    (obj): obj is Partial<T> => Boolean(obj),
  )

  if (validObjects.length === 0) {
    return {} as T
  }

  // Collect the union of all keys across every object
  const allKeys = new Set<string>()
  for (const obj of validObjects) {
    for (const key of Object.keys(obj)) {
      allKeys.add(key)
    }
  }

  const result = {} as T

  for (const key of allKeys) {
    const typedKey = key as keyof T

    // Collect all defined values for this key, in order
    const values: unknown[] = validObjects
      .map((obj) => obj[typedKey])
      .filter((v) => v !== undefined)

    if (values.length === 0) continue

    const firstValue = values[0]

    if (
      typeof firstValue === 'object' &&
      firstValue !== null &&
      !Array.isArray(firstValue)
    ) {
      // Nested classNames object — recurse via type-erased internal helper
      result[typedKey] = generateClassNames(
        values as object[],
        cn,
      ) as T[keyof T]
    } else if (values.every((v) => typeof v === 'string')) {
      // String values — combine with merge function
      result[typedKey] = merge(...(values)) as T[keyof T]
    } else {
      // Fallback: use the last defined value
      result[typedKey] = values[values.length - 1] as T[keyof T]
    }
  }

  return result
}
