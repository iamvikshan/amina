import { describe, test, expect, mock, beforeEach } from 'bun:test'

// Mock Logger to avoid side effects
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

// Mock the @anthropic-ai/vertex-sdk module
const mockCreate = mock(() =>
  Promise.resolve({
    content: [{ type: 'text', text: 'Claude reasoning response' }],
    usage: { input_tokens: 50, output_tokens: 30 },
  })
)

mock.module('@anthropic-ai/vertex-sdk', () => ({
  default: class MockAnthropicVertex {
    messages = { create: mockCreate }
    constructor(_config: any) {}
  },
}))

import { ClaudeClient } from '../src/helpers/claudeClient'
import { ModelRouter } from '../src/services/modelRouter'

describe('ClaudeClient', () => {
  let client: ClaudeClient

  beforeEach(() => {
    mockCreate.mockClear()
    client = new ClaudeClient({
      project: 'test-project',
      location: 'global',
      model: 'claude-sonnet-4-5',
      timeout: 30000,
    })
  })

  test('generates text-only response', async () => {
    const result = await client.generateText(
      'You are a helpful assistant',
      'Explain quantum computing briefly'
    )

    expect(result.text).toBe('Claude reasoning response')
    expect(result.tokensUsed).toBe(80)
    expect(result.latency).toBeGreaterThanOrEqual(0)
  })

  test('passes correct parameters to Anthropic API', async () => {
    await client.generateText('System prompt', 'User message', 512, 0.5)

    expect(mockCreate).toHaveBeenCalledTimes(1)
    const args = mockCreate.mock.calls[0][0] as any
    expect(args.model).toBe('claude-sonnet-4-5')
    expect(args.max_tokens).toBe(512)
    expect(args.system).toBe('System prompt')
    expect(args.messages[0].content).toBe('User message')
    expect(args.temperature).toBe(0.5)
  })

  test('handles API errors gracefully', async () => {
    mockCreate.mockImplementationOnce(() =>
      Promise.reject(new Error('API rate limited'))
    )

    await expect(client.generateText('System', 'Message')).rejects.toThrow(
      'API rate limited'
    )
  })

  test('timeout rejects with descriptive error', async () => {
    // Short timeout client
    const shortClient = new ClaudeClient({
      project: 'test-project',
      location: 'global',
      model: 'claude-sonnet-4-5',
      timeout: 10, // 10ms timeout
    })

    let timerId: ReturnType<typeof setTimeout> | undefined
    mockCreate.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          timerId = setTimeout(resolve, 5000)
        })
    )

    try {
      await expect(
        shortClient.generateText('System', 'Message')
      ).rejects.toThrow('Claude API timeout')
    } finally {
      if (timerId) clearTimeout(timerId)
    }
  })
})

describe('ModelRouter Claude integration', () => {
  test('reasoning dispatches to Claude when configured', () => {
    const router = new ModelRouter({
      model: 'gemini-3-flash-preview',
      embeddingModel: 'gemini-embedding-001',
      extractionModel: 'gemini-2.5-flash-lite',
      reasoningModel: 'claude-sonnet-4-5',
    })

    const config = router.getModel('reasoning')
    expect(config.model).toBe('claude-sonnet-4-5')
    expect(ModelRouter.isClaudeModel(config.model)).toBe(true)
  })

  test('reasoning falls back to Gemini when Claude not configured', () => {
    const router = new ModelRouter({
      model: 'gemini-3-flash-preview',
      embeddingModel: 'gemini-embedding-001',
      extractionModel: 'gemini-2.5-flash-lite',
    })

    const config = router.getModel('reasoning')
    expect(config.model).toBe('gemini-3-flash-preview')
    expect(ModelRouter.isClaudeModel(config.model)).toBe(false)
  })

  test('isClaudeModel identifies Claude models', () => {
    expect(ModelRouter.isClaudeModel('claude-sonnet-4-5')).toBe(true)
    expect(ModelRouter.isClaudeModel('claude-3-opus-20240229')).toBe(true)
    expect(ModelRouter.isClaudeModel('gemini-3-flash-preview')).toBe(false)
    expect(ModelRouter.isClaudeModel('gemini-embedding-001')).toBe(false)
  })
})
