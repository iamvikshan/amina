import { describe, test, expect, mock } from 'bun:test'

// Mock Logger BEFORE importing ModelRouter to properly intercept
mock.module('../src/helpers/Logger', () => ({
  default: {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    log: () => {},
    success: () => {},
  },
}))

const { ModelRouter } = await import('../src/services/modelRouter')

describe('ModelRouter', () => {
  const router = new ModelRouter({
    model: 'gemini-3-flash-preview',
    embeddingModel: 'text-embedding-005',
    extractionModel: 'gemini-2.5-flash-lite',
  })

  test('returns chat model for chat task', () => {
    const config = router.getModel('chat')
    expect(config.model).toBe('gemini-3-flash-preview')
    expect(config.taskType).toBe('chat')
  })

  test('returns embedding model for embedding task', () => {
    const config = router.getModel('embedding')
    expect(config.model).toBe('text-embedding-005')
    expect(config.taskType).toBe('embedding')
  })

  test('returns extraction model for extraction task', () => {
    const config = router.getModel('extraction')
    expect(config.model).toBe('gemini-2.5-flash-lite')
    expect(config.taskType).toBe('extraction')
  })

  describe('reasoning', () => {
    const routerWithClaude = new ModelRouter({
      model: 'gemini-3-flash-preview',
      embeddingModel: 'text-embedding-005',
      extractionModel: 'gemini-2.5-flash-lite',
      reasoningModel: 'claude-sonnet-4-5',
    })

    test('falls back to chat model when not configured', () => {
      const config = router.getModel('reasoning')
      expect(config.model).toBe('gemini-3-flash-preview')
      expect(config.taskType).toBe('reasoning')
    })

    test('uses dedicated model when configured', () => {
      const config = routerWithClaude.getModel('reasoning')
      expect(config.model).toBe('claude-sonnet-4-5')
      expect(config.taskType).toBe('reasoning')
    })

    test('hasReasoningModel returns false when not configured', () => {
      expect(router.hasReasoningModel()).toBe(false)
    })

    test('hasReasoningModel returns true when configured', () => {
      expect(routerWithClaude.hasReasoningModel()).toBe(true)
    })

    test('getRoutingSummary shows reasoning model when configured', () => {
      const summary = routerWithClaude.getRoutingSummary()
      expect(summary.reasoning).toBe('claude-sonnet-4-5')
    })
  })

  test('getRoutingSummary shows all models', () => {
    const summary = router.getRoutingSummary()
    expect(summary.chat).toBe('gemini-3-flash-preview')
    expect(summary.embedding).toBe('text-embedding-005')
    expect(summary.extraction).toBe('gemini-2.5-flash-lite')
    expect(summary.reasoning).toBe('gemini-3-flash-preview (fallback)')
  })

  test('throws on empty model string', () => {
    expect(
      () =>
        new ModelRouter({
          model: '',
          embeddingModel: 'text-embedding-005',
          extractionModel: 'gemini-2.5-flash-lite',
        })
    ).toThrow(/model is required and cannot be empty/)
  })

  test('throws on empty reasoningModel when provided', () => {
    expect(
      () =>
        new ModelRouter({
          model: 'gemini-3-flash-preview',
          embeddingModel: 'text-embedding-005',
          extractionModel: 'gemini-2.5-flash-lite',
          reasoningModel: '',
        })
    ).toThrow(/reasoningModel cannot be an empty string/)
  })

  test('isClaudeModel is case-insensitive', () => {
    expect(ModelRouter.isClaudeModel('Claude-3-opus')).toBe(true)
    expect(ModelRouter.isClaudeModel('CLAUDE-SONNET-4-5')).toBe(true)
    expect(ModelRouter.isClaudeModel('gemini-3-flash')).toBe(false)
  })
})
