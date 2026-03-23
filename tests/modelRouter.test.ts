import { describe, test, expect, mock } from 'bun:test'

// Mock Logger BEFORE importing ModelRouter to properly intercept
const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  log: () => {},
  success: () => {},
}

mock.module('../src/helpers/Logger', () => ({
  default: mockLogger,
  Logger: mockLogger,
  success: mockLogger.success,
  log: mockLogger.log,
  warn: mockLogger.warn,
  error: mockLogger.error,
  debug: mockLogger.debug,
}))

mock.module('@helpers/Logger', () => ({
  default: mockLogger,
  Logger: mockLogger,
  success: mockLogger.success,
  log: mockLogger.log,
  warn: mockLogger.warn,
  error: mockLogger.error,
  debug: mockLogger.debug,
}))

const { ModelRouter } = await import('../src/services/ai/modelRouter')

describe('ModelRouter', () => {
  const router = new ModelRouter({
    model: 'mistral-small-latest',
    embeddingModel: 'mistral-embed',
    extractionModel: 'mistral-small-latest',
  })

  test('returns chat model for chat task', () => {
    const config = router.getModel('chat')
    expect(config.model).toBe('mistral-small-latest')
    expect(config.taskType).toBe('chat')
  })

  test('returns embedding model for embedding task', () => {
    const config = router.getModel('embedding')
    expect(config.model).toBe('mistral-embed')
    expect(config.taskType).toBe('embedding')
  })

  test('returns extraction model for extraction task', () => {
    const config = router.getModel('extraction')
    expect(config.model).toBe('mistral-small-latest')
    expect(config.taskType).toBe('extraction')
  })

  test('getRoutingSummary shows all models', () => {
    const summary = router.getRoutingSummary()
    expect(summary.chat).toBe('mistral-small-latest')
    expect(summary.embedding).toBe('mistral-embed')
    expect(summary.extraction).toBe('mistral-small-latest')
  })

  test('throws on empty model string', () => {
    expect(
      () =>
        new ModelRouter({
          model: '',
          embeddingModel: 'mistral-embed',
          extractionModel: 'mistral-small-latest',
        })
    ).toThrow(/model is required and cannot be empty/)
  })
})
