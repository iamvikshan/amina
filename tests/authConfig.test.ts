import { describe, test, expect, mock, beforeEach } from 'bun:test'

// Mock database - mutable so tests can override model names
let mockDbConfig = {
  globallyEnabled: true,
  model: 'mistral-small-latest',
  embeddingModel: 'mistral-embed',
  extractionModel: 'mistral-small-latest',
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
      MODEL: 'mistral-small-latest',
      EMBEDDING_MODEL: 'mistral-embed',
      EXTRACTION_MODEL: 'mistral-small-latest',
      DEDUP_THRESHOLD: 0.85,
    },
  },
}))

const { configCache } = await import('../src/config/aiResponder')

describe('ConfigCache', () => {
  beforeEach(() => {
    configCache.invalidate()
    mockSecrets = { MISTRAL: 'test-mistral-key' }
    mockDbConfig = {
      globallyEnabled: true,
      model: 'mistral-small-latest',
      embeddingModel: 'mistral-embed',
      extractionModel: 'mistral-small-latest',
      maxTokens: 1024,
      timeoutMs: 20000,
      systemPrompt: 'test prompt',
      temperature: 0.7,
      dmEnabledGlobally: false,
      dedupThreshold: 0.85,
    }
  })

  test('returns valid config with MISTRAL key', async () => {
    const config = await configCache.getConfig()
    expect(config.globallyEnabled).toBe(true)
    expect(config.mistralApiKey).toBe('test-mistral-key')
    expect(config.model).toBe('mistral-small-latest')
  })

  test('throws when MISTRAL key missing and AI enabled', async () => {
    mockSecrets = {}
    await expect(configCache.getConfig()).rejects.toThrow(/MISTRAL/)
  })

  test('GROQ key is optional', async () => {
    mockSecrets = { MISTRAL: 'test-key' }
    const config = await configCache.getConfig()
    expect(config.groqApiKey).toBeUndefined()
  })

  test('includes GROQ key when present', async () => {
    mockSecrets = { MISTRAL: 'test-key', GROQ: 'groq-key' }
    const config = await configCache.getConfig()
    expect(config.groqApiKey).toBe('groq-key')
  })

  test('invalidate clears cache', async () => {
    await configCache.getConfig() // warm cache
    configCache.invalidate()
    // Should re-fetch on next call (no error means it worked)
    const config = await configCache.getConfig()
    expect(config).toBeDefined()
  })
})

describe('ConfigCache - stale Gemini model override', () => {
  beforeEach(() => {
    configCache.invalidate()
    mockSecrets = { MISTRAL: 'test-mistral-key' }
    mockDbConfig = {
      globallyEnabled: true,
      model: 'gemini-3-flash-preview',
      embeddingModel: 'gemini-embedding-001',
      extractionModel: 'gemini-2.5-flash-lite',
      maxTokens: 1024,
      timeoutMs: 20000,
      systemPrompt: 'test prompt',
      temperature: 0.7,
      dmEnabledGlobally: false,
      dedupThreshold: 0.85,
    }
  })

  test('overrides stale gemini model with mistral default', async () => {
    const cfg = await configCache.getConfig()
    expect(cfg.model).toBe('mistral-small-latest')
  })

  test('overrides stale gemini embeddingModel with mistral default', async () => {
    const cfg = await configCache.getConfig()
    expect(cfg.embeddingModel).toBe('mistral-embed')
  })

  test('overrides stale gemini extractionModel with mistral default', async () => {
    const cfg = await configCache.getConfig()
    expect(cfg.extractionModel).toBe('mistral-small-latest')
  })

  test('preserves non-gemini model names from DB', async () => {
    mockDbConfig.model = 'custom-model-v2'
    mockDbConfig.embeddingModel = 'custom-embed'
    mockDbConfig.extractionModel = 'custom-extract'
    configCache.invalidate()

    const cfg = await configCache.getConfig()
    expect(cfg.model).toBe('custom-model-v2')
    expect(cfg.embeddingModel).toBe('custom-embed')
    expect(cfg.extractionModel).toBe('custom-extract')
  })
})
