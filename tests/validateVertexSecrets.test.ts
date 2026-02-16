import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import { logCredentialPrecedence } from '../src/config/secrets'
import Logger from '../src/helpers/Logger'

describe('logCredentialPrecedence', () => {
  const originalEnv = { ...process.env }
  let logSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    delete process.env.GEMINI_KEY
    logSpy = spyOn(Logger, 'log')
  })

  afterEach(() => {
    // Restore only touched keys
    if (originalEnv.GOOGLE_SERVICE_ACCOUNT_JSON !== undefined) {
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON =
        originalEnv.GOOGLE_SERVICE_ACCOUNT_JSON
    } else {
      delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    }
    if (originalEnv.GEMINI_KEY !== undefined) {
      process.env.GEMINI_KEY = originalEnv.GEMINI_KEY
    } else {
      delete process.env.GEMINI_KEY
    }
    logSpy.mockRestore()
  })

  test('no-op when no credentials are set', () => {
    logCredentialPrecedence()
    expect(logSpy).not.toHaveBeenCalled()
  })

  test('no-op when only GEMINI_KEY is set', () => {
    process.env.GEMINI_KEY = 'test-key'
    logCredentialPrecedence()
    expect(logSpy).not.toHaveBeenCalled()
  })

  test('no-op when only GOOGLE_SERVICE_ACCOUNT_JSON is set', () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = '{"key": "value"}'
    logCredentialPrecedence()
    expect(logSpy).not.toHaveBeenCalled()
  })

  test('logs precedence when both credentials are set', () => {
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON = '{"key": "value"}'
    process.env.GEMINI_KEY = 'test-key'
    logCredentialPrecedence()
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Vertex credentials will take precedence')
    )
  })
})
