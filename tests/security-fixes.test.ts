/**
 * Security Fixes Tests (Phase 2)
 *
 * Tests for SSRF blocking, KV key redaction, and double-escape prevention.
 */

import { describe, test, expect } from 'bun:test'

// Minimal type stubs for testing (full definitions live in types/api/ and @cloudflare/workers-types)
// Using `as unknown as Env` / `as unknown as KVNamespace` so shape doesn't matter.
type Env = Record<string, unknown>
type KVNamespace = Record<string, unknown>

// ============================================================================
// 1. SSRF Blocking Tests (bot-stats.ts)
// ============================================================================

describe('SSRF blocking in bot-stats', () => {
  // We test the SSRF validation logic by importing getBotStats
  // and passing private IP URLs

  const mockEnv = {
    CACHE: undefined,
    BOT_STATS_URL: undefined,
  } as unknown as Env

  test('should reject localhost URLs', async () => {
    const { getBotStats } = await import('../api/src/lib/bot-stats')
    const result = await getBotStats(mockEnv, { url: 'http://localhost:8080' })
    expect(result.status).toBe('offline')
    expect(result.guilds).toBe(0)
  })

  test('should reject 127.0.0.1 URLs', async () => {
    const { getBotStats } = await import('../api/src/lib/bot-stats')
    const result = await getBotStats(mockEnv, { url: 'http://127.0.0.1:3000' })
    expect(result.status).toBe('offline')
    expect(result.guilds).toBe(0)
  })

  test('should reject 10.x.x.x private IPs', async () => {
    const { getBotStats } = await import('../api/src/lib/bot-stats')
    const result = await getBotStats(mockEnv, {
      url: 'http://10.0.0.1:8080',
    })
    expect(result.status).toBe('offline')
    expect(result.guilds).toBe(0)
  })

  test('should reject 192.168.x.x private IPs', async () => {
    const { getBotStats } = await import('../api/src/lib/bot-stats')
    const result = await getBotStats(mockEnv, {
      url: 'http://192.168.1.1',
    })
    expect(result.status).toBe('offline')
    expect(result.guilds).toBe(0)
  })

  test('should reject 172.16-31.x.x private IPs', async () => {
    const { getBotStats } = await import('../api/src/lib/bot-stats')
    const result = await getBotStats(mockEnv, {
      url: 'http://172.16.0.1',
    })
    expect(result.status).toBe('offline')
    expect(result.guilds).toBe(0)
  })

  test('should reject IPv6 loopback', async () => {
    const { getBotStats } = await import('../api/src/lib/bot-stats')
    const result = await getBotStats(mockEnv, { url: 'http://[::1]:3000' })
    expect(result.status).toBe('offline')
    expect(result.guilds).toBe(0)
  })

  test('should reject .internal domains', async () => {
    const { getBotStats } = await import('../api/src/lib/bot-stats')
    const result = await getBotStats(mockEnv, {
      url: 'http://service.internal',
    })
    expect(result.status).toBe('offline')
    expect(result.guilds).toBe(0)
  })

  test('should reject 0.0.0.0', async () => {
    const { getBotStats } = await import('../api/src/lib/bot-stats')
    const result = await getBotStats(mockEnv, { url: 'http://0.0.0.0:8080' })
    expect(result.status).toBe('offline')
    expect(result.guilds).toBe(0)
  })

  test('should reject non-http(s) schemes', async () => {
    const { getBotStats } = await import('../api/src/lib/bot-stats')
    const result = await getBotStats(mockEnv, { url: 'ftp://example.com' })
    expect(result.status).toBe('offline')
    expect(result.guilds).toBe(0)
  })
})

// ============================================================================
// 2. KV Key Redaction Tests (botAuth.ts)
// ============================================================================

describe('KV key redaction in deregisterBot', () => {
  test('error message should not contain actual KV key names', async () => {
    const { deregisterBot } = await import('../api/src/lib/botAuth')

    // Create a mock KV that fails on delete
    const mockKv = {
      get: async (key: string) => {
        if (key.endsWith(':auth')) {
          // Return valid auth data so validateBotRequest can proceed
          // We need to use a real hash format
          const { hashSecret } = await import('../api/src/lib/botAuth')
          return JSON.stringify({
            secretHash: hashSecret('test-secret'),
            registeredAt: new Date().toISOString(),
            lastVerified: new Date().toISOString(),
            verificationExpires: new Date(Date.now() + 3600000).toISOString(),
            ownerId: 'owner123',
          })
        }
        return null
      },
      put: async () => {},
      delete: async () => {
        throw new Error('KV delete failed')
      },
      list: async () => ({ keys: [], list_complete: true, cursor: '' }),
      getWithMetadata: async () => ({ value: null, metadata: null }),
    } as unknown as KVNamespace

    const result = await deregisterBot(mockKv, 'test-client-id', 'test-secret')

    // The result should indicate failure
    expect(result.success).toBe(false)

    if (result.error) {
      // Error message should NOT contain actual KV key patterns
      expect(result.error).not.toContain('bot:test-client-id:auth')
      expect(result.error).not.toContain('bot:test-client-id:meta')
      expect(result.error).not.toContain('bot:test-client-id:stats')
      expect(result.error).not.toContain('bot:test-client-id:commands')

      // Should contain a count instead
      expect(result.error).toMatch(/\d+ key\(s\)/)
    }
  })
})

// ============================================================================
// 3. Double-Escape Prevention Tests (svg-utils.ts)
// ============================================================================

describe('Double-escape prevention in getImageUrl', () => {
  test('should not double-escape URLs with ampersands', async () => {
    const { getImageUrl } = await import('../api/src/lib/svg-utils')

    const mockContext = {
      req: {
        query: (key: string) => {
          if (key === 'image') return 'https://example.com/image?a=1&b=2'
          return undefined
        },
      },
    }

    const result = getImageUrl(mockContext)
    // getImageUrl now returns XML-escaped URLs for safe SVG embedding
    expect(result).toBe('https://example.com/image?a=1&amp;b=2')
    // Should be escaped exactly once (not double-escaped)
    expect(result).not.toContain('&amp;amp;')
  })

  test('should escape special characters for SVG embedding', async () => {
    const { getImageUrl } = await import('../api/src/lib/svg-utils')

    const mockContext = {
      req: {
        query: (key: string) => {
          if (key === 'image') return "https://example.com/image?name=test's"
          return undefined
        },
      },
    }

    const result = getImageUrl(mockContext)
    // Should be escaped for safe SVG attribute embedding
    expect(result).toContain('&apos;')
  })

  test('should still return null for invalid URLs', async () => {
    const { getImageUrl } = await import('../api/src/lib/svg-utils')

    const mockContext = {
      req: {
        query: (key: string) => {
          if (key === 'image') return 'not-a-url'
          return undefined
        },
      },
    }

    const result = getImageUrl(mockContext)
    expect(result).toBeNull()
  })

  test('should return null for non-http schemes', async () => {
    const { getImageUrl } = await import('../api/src/lib/svg-utils')

    const mockContext = {
      req: {
        query: (key: string) => {
          if (key === 'image') return 'javascript:alert(1)'
          return undefined
        },
      },
    }

    const result = getImageUrl(mockContext)
    expect(result).toBeNull()
  })

  test('should return null for missing URL', async () => {
    const { getImageUrl } = await import('../api/src/lib/svg-utils')

    const mockContext = {
      req: {
        query: () => undefined,
      },
    }

    const result = getImageUrl(mockContext)
    expect(result).toBeNull()
  })
})
