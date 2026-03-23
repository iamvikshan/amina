import { describe, test, expect, mock, beforeEach } from 'bun:test'

// Mock database - mutable so tests can override model names
let mockDbConfig = {
  globallyEnabled: true,
  model: 'gemini-flash-latest',
  embeddingModel: 'voyage-4-lite',
  extractionModel: 'gemini-3.1-flash-lite-preview',
  maxTokens: 1024,
  timeoutMs: 20000,
  systemPrompt: 'test prompt',
  temperature: 0.7,
  dmEnabledGlobally: false,
  dedupThreshold: 0.85,
}

mock.module('../src/database/schemas/Dev', () => ({
  getAiConfig: async () => ({ ...mockDbConfig }),
}))

// Mock secrets - will be overridden per test
let mockSecrets: Record<string, string | undefined> = {}
mock.module('../src/config/secrets', () => ({
  secret: new Proxy({} as any, {
    get: (_target: any, prop: string) => mockSecrets[prop],
  }),
}))

mock.module('../src/config/config', () => ({
  config: {
    AI: {
      MODEL: 'gemini-flash-latest',
      EMBEDDING_MODEL: 'voyage-4-lite',
      EXTRACTION_MODEL: 'gemini-3.1-flash-lite-preview',
      DEDUP_THRESHOLD: 0.85,
    },
  },
}))

const { configCache } = await import('../src/config/aiResponder')

describe('ConfigCache', () => {
  beforeEach(() => {
    configCache.invalidate()
    mockSecrets = { GEMINI: 'test-gemini-key', MISTRAL: 'test-mistral-key' }
    mockDbConfig = {
      globallyEnabled: true,
      model: 'gemini-flash-latest',
      embeddingModel: 'voyage-4-lite',
      extractionModel: 'gemini-3.1-flash-lite-preview',
      maxTokens: 1024,
      timeoutMs: 20000,
      systemPrompt: 'test prompt',
      temperature: 0.7,
      dmEnabledGlobally: false,
      dedupThreshold: 0.85,
    }
  })

  test('returns valid config with GEMINI key', async () => {
    const config = await configCache.getConfig()
    expect(config.globallyEnabled).toBe(true)
    expect(config.geminiApiKey).toBe('test-gemini-key')
    expect(config.model).toBe('gemini-flash-latest')
  })

  test('throws when GEMINI key missing and AI enabled', async () => {
    mockSecrets = {}
    await expect(configCache.getConfig()).rejects.toThrow(/GEMINI/)
  })

  test('MISTRAL key is optional', async () => {
    mockSecrets = { GEMINI: 'test-key' }
    const config = await configCache.getConfig()
    expect(config.mistralApiKey).toBeUndefined()
  })

  test('includes MISTRAL key when present', async () => {
    mockSecrets = { GEMINI: 'test-key', MISTRAL: 'mistral-key' }
    const config = await configCache.getConfig()
    expect(config.mistralApiKey).toBe('mistral-key')
  })

  test('invalidate clears cache', async () => {
    await configCache.getConfig() // warm cache
    configCache.invalidate()
    const config = await configCache.getConfig()
    expect(config).toBeDefined()
  })
})

describe('ConfigCache - DB model pass-through', () => {
  beforeEach(() => {
    configCache.invalidate()
    mockSecrets = { GEMINI: 'test-gemini-key' }
  })

  test('passes through model names from DB unchanged', async () => {
    mockDbConfig = {
      globallyEnabled: true,
      model: 'gemini-flash-latest',
      embeddingModel: 'voyage-4-lite',
      extractionModel: 'gemini-3.1-flash-lite-preview',
      maxTokens: 1024,
      timeoutMs: 20000,
      systemPrompt: 'test prompt',
      temperature: 0.7,
      dmEnabledGlobally: false,
      dedupThreshold: 0.85,
    }

    const cfg = await configCache.getConfig()
    expect(cfg.model).toBe('gemini-flash-latest')
    expect(cfg.embeddingModel).toBe('voyage-4-lite')
    expect(cfg.extractionModel).toBe('gemini-3.1-flash-lite-preview')
  })

  test('preserves custom model names from DB', async () => {
    mockDbConfig = {
      globallyEnabled: true,
      model: 'custom-model-v2',
      embeddingModel: 'custom-embed',
      extractionModel: 'custom-extract',
      maxTokens: 1024,
      timeoutMs: 20000,
      systemPrompt: 'test prompt',
      temperature: 0.7,
      dmEnabledGlobally: false,
      dedupThreshold: 0.85,
    }

    const cfg = await configCache.getConfig()
    expect(cfg.model).toBe('custom-model-v2')
    expect(cfg.embeddingModel).toBe('custom-embed')
    expect(cfg.extractionModel).toBe('custom-extract')
  })
})
