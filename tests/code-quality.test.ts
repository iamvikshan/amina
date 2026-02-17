import { describe, test, expect } from 'bun:test'
import { svgResponse } from '../api/src/lib/svg-utils'
import { errors } from '../api/src/lib/response'

// Minimal Hono-like Context mock for testing error helpers
function createMockContext() {
  return {
    json: (body: unknown, status: number) => {
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    },
  } as Parameters<typeof errors.notImplemented>[0]
}

describe('svgResponse', () => {
  test('returns correct Content-Type header', () => {
    const response = svgResponse('<svg></svg>')
    expect(response.headers.get('Content-Type')).toBe('image/svg+xml')
  })

  test('returns correct default Cache-Control header (max-age=3600)', () => {
    const response = svgResponse('<svg></svg>')
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=3600'
    )
  })

  test('returns correct custom maxAge Cache-Control header', () => {
    const response = svgResponse('<svg></svg>', 86400)
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=86400'
    )
  })

  test('returns correct body content', async () => {
    const svgContent = '<svg width="100" height="100"><rect/></svg>'
    const response = svgResponse(svgContent)
    const body = await response.text()
    expect(body).toBe(svgContent)
  })

  test('accepts maxAge of 0', () => {
    const response = svgResponse('<svg></svg>', 0)
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=0')
  })
})

describe('errors.notImplemented', () => {
  test('returns 501 status code', async () => {
    const c = createMockContext()
    const response = errors.notImplemented(c)
    expect(response.status).toBe(501)
  })

  test('returns default message', async () => {
    const c = createMockContext()
    const response = errors.notImplemented(c)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error.message).toBe('Not implemented')
    expect(body.error.code).toBe('NOT_IMPLEMENTED')
  })

  test('returns custom message', async () => {
    const c = createMockContext()
    const response = errors.notImplemented(c, 'Feature coming soon')
    const body = await response.json()
    expect(body.error.message).toBe('Feature coming soon')
  })

  test('response has standard error shape with meta', async () => {
    const c = createMockContext()
    const response = errors.notImplemented(c)
    const body = await response.json()
    expect(body).toHaveProperty('success')
    expect(body).toHaveProperty('error')
    expect(body).toHaveProperty('meta')
    expect(body.meta).toHaveProperty('generatedAt')
  })
})
