import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchBskyActors, createDebouncedSearch } from './blueskyApi'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFetchResponse(data: unknown, ok = true): Response {
  return {
    ok,
    json: () => Promise.resolve(data),
  } as unknown as Response
}

function mockActors(actors: object[]) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse({ actors })))
}

function mockFetchError() {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
}

function mockFetchNotOk() {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse({}, false)))
}

// ─── searchBskyActors ─────────────────────────────────────────────────────────

describe('searchBskyActors', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty array for empty query', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const result = await searchBskyActors('')
    expect(result).toEqual([])
    // Should not make any network request
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('returns empty array for whitespace-only query', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const result = await searchBskyActors('   ')
    expect(result).toEqual([])
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('maps API actors to MentionSuggestion objects', async () => {
    mockActors([
      {
        did: 'did:plc:abc123',
        handle: 'alice.bsky.social',
        displayName: 'Alice',
        avatar: 'https://cdn.bsky.app/alice.jpg',
      },
      {
        did: 'did:plc:def456',
        handle: 'bob.bsky.social',
        // no displayName or avatar — should omit those keys
      },
    ])

    const result = await searchBskyActors('alice')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      did: 'did:plc:abc123',
      handle: 'alice.bsky.social',
      displayName: 'Alice',
      avatarUrl: 'https://cdn.bsky.app/alice.jpg',
    })
    // Optional fields absent when not in API response
    expect(result[1]).toEqual({
      did: 'did:plc:def456',
      handle: 'bob.bsky.social',
    })
    expect('displayName' in (result[1] ?? {})).toBe(false)
    expect('avatarUrl' in (result[1] ?? {})).toBe(false)
  })

  it('calls the correct API URL with query and limit params', async () => {
    mockActors([])

    await searchBskyActors('carol', 5)

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string
    expect(calledUrl).toContain('app.bsky.actor.searchActors')
    expect(calledUrl).toContain('q=carol')
    expect(calledUrl).toContain('limit=5')
  })

  it('trims the query before sending', async () => {
    mockActors([])

    await searchBskyActors('  dave  ')

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string
    expect(calledUrl).toContain('q=dave')
    expect(calledUrl).not.toContain('q=++dave')
  })

  it('returns empty array when API responds with non-ok status', async () => {
    mockFetchNotOk()
    const result = await searchBskyActors('alice')
    expect(result).toEqual([])
  })

  it('returns empty array on network error', async () => {
    mockFetchError()
    const result = await searchBskyActors('alice')
    expect(result).toEqual([])
  })

  it('returns empty array when API response has no actors field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse({})))

    const result = await searchBskyActors('alice')
    expect(result).toEqual([])
  })

  it('uses default limit of 8 when not specified', async () => {
    mockActors([])

    await searchBskyActors('test')

    const calledUrl = vi.mocked(fetch).mock.calls[0]?.[0] as string
    expect(calledUrl).toContain('limit=8')
  })
})

// ─── createDebouncedSearch ────────────────────────────────────────────────────

describe('createDebouncedSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces rapid calls — only fires one network request', async () => {
    mockActors([{ did: 'did:plc:1', handle: 'alice.bsky.social' }])

    const debouncedSearch = createDebouncedSearch(300)

    // Fire 3 rapid calls
    const p1 = debouncedSearch('a')
    const p2 = debouncedSearch('al')
    const p3 = debouncedSearch('ali')

    // Advance past the debounce window
    await vi.runAllTimersAsync()

    // All three promises resolve
    const [r1, r2, r3] = await Promise.all([p1, p2, p3])

    // Only one fetch should have been made (the last query "ali")
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)

    // All three callers get the same result
    expect(r1).toEqual(r2)
    expect(r2).toEqual(r3)
  })

  it('fires a new request after the debounce window has elapsed', async () => {
    mockActors([])

    const debouncedSearch = createDebouncedSearch(300)

    const p1 = debouncedSearch('alice')
    await vi.runAllTimersAsync()
    await p1

    const p2 = debouncedSearch('alice')
    await vi.runAllTimersAsync()
    await p2

    // Two separate calls, each after debounce window — 2 fetches
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
  })

  it('resolves with empty array for empty query (no fetch)', async () => {
    vi.stubGlobal('fetch', vi.fn())

    const debouncedSearch = createDebouncedSearch(300)
    const p = debouncedSearch('')

    await vi.runAllTimersAsync()
    const result = await p

    expect(result).toEqual([])
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it('returns results from the actual API response', async () => {
    mockActors([
      { did: 'did:plc:xyz', handle: 'charlie.bsky.social', displayName: 'Charlie' },
    ])

    const debouncedSearch = createDebouncedSearch(200)
    const p = debouncedSearch('charlie')

    await vi.runAllTimersAsync()
    const result = await p

    expect(result).toHaveLength(1)
    expect(result[0]?.handle).toBe('charlie.bsky.social')
  })
})
