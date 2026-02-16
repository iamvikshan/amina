import { describe, test, expect, mock, beforeEach } from 'bun:test'

// Mock the @google/genai module before importing AiClient
const mockGenerateContent = mock(() =>
  Promise.resolve({
    text: 'Hello!',
    functionCalls: undefined as any,
    usageMetadata: {
      totalTokenCount: 42,
      promptTokenCount: 10,
      candidatesTokenCount: 32,
    },
    candidates: [{ content: { role: 'model', parts: [{ text: 'Hello!' }] } }],
  })
)

const mockEmbedContent = mock(() =>
  Promise.resolve({
    embeddings: [{ values: new Array(3072).fill(0.1) }],
  })
)

mock.module('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
      embedContent: mockEmbedContent,
    }
  },
}))

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

import { AiClient, AiCircuitBreakerError } from '../src/helpers/aiClient'

describe('AiClient', () => {
  let client: AiClient

  beforeEach(() => {
    mockGenerateContent.mockReset()
    mockGenerateContent.mockImplementation(() =>
      Promise.resolve({
        text: 'Hello!',
        functionCalls: undefined as any,
        usageMetadata: {
          totalTokenCount: 42,
          promptTokenCount: 10,
          candidatesTokenCount: 32,
        },
        candidates: [
          { content: { role: 'model', parts: [{ text: 'Hello!' }] } },
        ],
      })
    )
    mockEmbedContent.mockClear()
    AiClient.resetCircuit()
    AiClient.setRetryDelay(1)
    client = new AiClient(
      { mode: 'api-key', apiKey: 'test-api-key' },
      'gemini-3-flash-preview',
      30000
    )
  })

  test('initializes with vertex config', () => {
    const vertexClient = new AiClient(
      { mode: 'vertex', project: 'test-project', location: 'global' },
      'gemini-3-flash-preview',
      30000
    )
    expect(vertexClient.getAuthMode()).toBe('vertex')
  })

  test('initializes with api-key config', () => {
    expect(client.getAuthMode()).toBe('api-key')
  })

  test('generateResponse returns structured content with text', async () => {
    const result = await client.generateResponse(
      'You are helpful',
      [],
      'Hello',
      1000,
      0.7
    )

    expect(result.text).toBe('Hello!')
    expect(result.latency).toBeGreaterThanOrEqual(0)
  })

  test('real token count from usageMetadata', async () => {
    const result = await client.generateResponse(
      'System prompt',
      [],
      'Hello',
      1000,
      0.7
    )

    expect(result.tokensUsed).toBe(42)
  })

  test('modelContent preserves full response parts', async () => {
    const result = await client.generateResponse(
      'System prompt',
      [],
      'Hello',
      1000,
      0.7
    )

    expect(result.modelContent).toBeDefined()
    expect(result.modelContent).toEqual([{ text: 'Hello!' }])
  })

  test('history preserves full content parts', async () => {
    const history: ConversationMessage[] = [
      { role: 'user', parts: [{ text: 'First message' }] },
      { role: 'model', parts: [{ text: 'First response' }] },
    ]

    await client.generateResponse(
      'System prompt',
      history,
      'Second message',
      1000,
      0.7
    )

    // Verify the contents passed to generateContent include history + current message
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
    const callArgs = mockGenerateContent.mock.calls[0][0] as any
    expect(callArgs.contents).toHaveLength(3) // 2 history + 1 current
    expect(callArgs.contents[0].parts).toEqual([{ text: 'First message' }])
    expect(callArgs.contents[1].parts).toEqual([{ text: 'First response' }])
    expect(callArgs.contents[2].parts).toEqual([{ text: 'Second message' }])
  })

  test('tool calls extracted from structured response', async () => {
    mockGenerateContent.mockImplementationOnce(() =>
      Promise.resolve({
        text: 'I will timeout that user.',
        functionCalls: [
          { name: 'timeout', args: { user: '123', duration: 60 } },
        ],
        usageMetadata: { totalTokenCount: 50 },
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                { text: 'I will timeout that user.' },
                {
                  functionCall: {
                    name: 'timeout',
                    args: { user: '123', duration: 60 },
                  },
                },
              ],
            },
          },
        ],
      })
    )

    const result = await client.generateResponse(
      'System prompt',
      [],
      'Timeout user 123',
      1000,
      0.7
    )

    expect(result.functionCalls).toBeDefined()
    expect(result.functionCalls).toHaveLength(1)
    expect(result.functionCalls?.[0].name).toBe('timeout')
    expect(result.functionCalls?.[0].args).toEqual({
      user: '123',
      duration: 60,
    })

    // modelContent should include both text and function call parts
    expect(result.modelContent).toHaveLength(2)
  })

  test('timeout handling', async () => {
    // Uses a very short timeout (10ms) with a mock that would take 5000ms
    // The race condition is deterministic: timeout always fires first
    const shortTimeoutClient = new AiClient(
      { mode: 'api-key', apiKey: 'test-key' },
      'model',
      10
    )

    mockGenerateContent.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 5000))
    )

    await expect(
      shortTimeoutClient.generateResponse('System', [], 'Hello', 1000, 0.7)
    ).rejects.toThrow('API timeout')
  })

  test('config includes systemInstruction and tools', async () => {
    const tools = [
      {
        name: 'test_cmd',
        description: 'A test command',
        parameters: { type: 'OBJECT', properties: {}, required: [] },
      },
    ]

    await client.generateResponse(
      'You are Mina',
      [],
      'Hello',
      500,
      0.9,
      undefined,
      tools
    )

    const callArgs = mockGenerateContent.mock.calls[0][0] as any
    expect(callArgs.config.systemInstruction).toBe('You are Mina')
    expect(callArgs.config.maxOutputTokens).toBe(500)
    expect(callArgs.config.temperature).toBe(0.9)
    expect(callArgs.config.tools).toEqual([{ functionDeclarations: tools }])
  })

  test('no tools passed when tools array is undefined', async () => {
    await client.generateResponse('System', [], 'Hello', 1000, 0.7)

    const callArgs = mockGenerateContent.mock.calls[0][0] as any
    expect(callArgs.config.tools).toBeUndefined()
  })

  test('empty text defaults to empty string', async () => {
    mockGenerateContent.mockImplementationOnce(() =>
      Promise.resolve({
        text: undefined,
        functionCalls: undefined,
        usageMetadata: { totalTokenCount: 5 },
        candidates: [{ content: { role: 'model', parts: [] } }],
      })
    )

    const result = await client.generateResponse(
      'System',
      [],
      'Hello',
      1000,
      0.7
    )
    expect(result.text).toBe('')
  })

  test('empty user message with no media skips user content', async () => {
    // ConversationMessage type is globally declared in types/services.d.ts
    const history: ConversationMessage[] = [
      { role: 'user', parts: [{ text: 'Earlier message' }] },
      { role: 'model', parts: [{ text: 'Earlier response' }] },
    ]

    await client.generateResponse(
      'System prompt',
      history,
      '   ', // whitespace-only message
      1000,
      0.7,
      undefined // no media
    )

    const callArgs = mockGenerateContent.mock.calls[0][0] as any
    // Should only have the 2 history messages, no empty-parts user message appended
    expect(callArgs.contents).toHaveLength(2)
    expect(callArgs.contents[0].parts).toEqual([{ text: 'Earlier message' }])
    expect(callArgs.contents[1].parts).toEqual([{ text: 'Earlier response' }])
  })

  test('token extraction returns promptTokens and completionTokens', async () => {
    const result = await client.generateResponse(
      'System prompt',
      [],
      'Hello',
      1000,
      0.7
    )

    expect(result.promptTokens).toBe(10)
    expect(result.completionTokens).toBe(32)
  })

  test('retries on 429 and succeeds', async () => {
    let callCount = 0
    mockGenerateContent.mockImplementation(() => {
      callCount++
      if (callCount <= 2) {
        const error: any = new Error('Rate limited')
        error.status = 429
        return Promise.reject(error)
      }
      return Promise.resolve({
        text: 'Success after retry',
        functionCalls: undefined,
        usageMetadata: {
          totalTokenCount: 10,
          promptTokenCount: 5,
          candidatesTokenCount: 5,
        },
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Success after retry' }],
            },
          },
        ],
      })
    })

    const result = await client.generateResponse(
      'System',
      [],
      'Hello',
      1000,
      0.7
    )
    expect(result.text).toBe('Success after retry')
    expect(callCount).toBe(3)
  })

  test('circuit breaker opens after repeated failures', async () => {
    AiClient.resetCircuit()

    mockGenerateContent.mockImplementation(() => {
      const error: any = new Error('Server error')
      error.status = 500
      return Promise.reject(error)
    })

    // 5 failures to open the circuit
    for (let i = 0; i < 5; i++) {
      try {
        await client.generateResponse('System', [], 'Hello', 1000, 0.7)
      } catch {
        // Expected
      }
    }

    // Reset mock to verify no new calls
    mockGenerateContent.mockClear()

    // Circuit should be open
    await expect(
      client.generateResponse('System', [], 'Hello', 1000, 0.7)
    ).rejects.toBeInstanceOf(AiCircuitBreakerError)

    // No API call should have been made
    expect(mockGenerateContent).not.toHaveBeenCalled()

    AiClient.resetCircuit()
  })
})
