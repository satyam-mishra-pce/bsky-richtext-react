/**
 * Bluesky public API helpers for mention search.
 *
 * `searchBskyActors` calls the unauthenticated public Bluesky API to look up
 * actor suggestions. It is used as the default `onMentionQuery` implementation
 * in `RichTextEditor` — no API key or authentication required.
 *
 * `createDebouncedSearch` wraps `searchBskyActors` with a debounce so rapid
 * keystrokes don't fire unnecessary network requests. Only the latest in-flight
 * query resolves; stale promises from earlier keystrokes are silently discarded.
 */

import type { MentionSuggestion } from '../components/RichTextEditor/RichTextEditor'

// ─── Constants ───────────────────────────────────────────────────────────────

const BSKY_SEARCH_API =
  'https://public.api.bsky.app/xrpc/app.bsky.actor.searchActors'

// ─── Raw API ─────────────────────────────────────────────────────────────────

/**
 * Shape of a single actor returned by the Bluesky public search API.
 * Only the fields we care about are typed here.
 */
interface BskyActor {
  did: string
  handle: string
  displayName?: string
  avatar?: string
}

/**
 * Search for Bluesky actors using the public, unauthenticated API.
 *
 * Returns up to `limit` matching `MentionSuggestion` objects, or an empty
 * array if the query is blank, the network request fails, or the response is
 * malformed.
 *
 * @param query - Text the user typed after "@"
 * @param limit - Max results to return (default: 8)
 */
export async function searchBskyActors(
  query: string,
  limit = 8,
): Promise<MentionSuggestion[]> {
  if (!query.trim()) return []

  try {
    const url = new URL(BSKY_SEARCH_API)
    url.searchParams.set('q', query.trim())
    url.searchParams.set('limit', String(limit))

    const res = await fetch(url.toString())
    if (!res.ok) return []

    const data = (await res.json()) as { actors?: BskyActor[] }

    return (data.actors ?? []).map((actor) => ({
      did: actor.did,
      handle: actor.handle,
      ...(actor.displayName !== undefined
        ? { displayName: actor.displayName }
        : {}),
      ...(actor.avatar !== undefined ? { avatarUrl: actor.avatar } : {}),
    }))
  } catch {
    // Network error, JSON parse error, etc. — fail gracefully
    return []
  }
}

// ─── Debounced search ────────────────────────────────────────────────────────

/**
 * Create a debounced version of `searchBskyActors`.
 *
 * Rapid calls within `delayMs` are coalesced — only the *latest* invocation
 * fires a network request. Earlier pending promises resolve with the same
 * result as the latest call (they are not rejected or left dangling).
 *
 * @param delayMs - Debounce window in milliseconds (default: 300)
 *
 * @example
 * ```ts
 * const debouncedSearch = createDebouncedSearch(400)
 * // Pass to onMentionQuery or use as the internal default
 * ```
 */
export function createDebouncedSearch(
  delayMs = 300,
): (query: string) => Promise<MentionSuggestion[]> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  // Track all pending resolvers so every outstanding promise gets the result
  // of the most recent query, preventing stale dangling promises.
  const pendingResolvers: Array<(value: MentionSuggestion[]) => void> = []

  return (query: string): Promise<MentionSuggestion[]> => {
    return new Promise((resolve) => {
      // Queue this caller's resolver
      pendingResolvers.push(resolve)

      // Cancel the previous scheduled search
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(async () => {
        timeoutId = null
        const results = await searchBskyActors(query)

        // Flush all queued resolvers with the same result set.
        // Splice to avoid mutation-during-iteration issues.
        const toResolve = pendingResolvers.splice(0, pendingResolvers.length)
        for (const r of toResolve) {
          r(results)
        }
      }, delayMs)
    })
  }
}
