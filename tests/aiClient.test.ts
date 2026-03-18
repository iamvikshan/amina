import { describe, test, expect, mock, beforeEach } from 'bun:test'

// -- Mocks must be declared before imports that use them --

const mockMistralComplete = mock((): Promise<any> =>
  Promise.resolve({
    choices: [
      {
        message: { content: 'Hello!', toolCalls: undefined },
        finishReason: 'stop',
      },
    ],
    usage: { totalTokens: 42, promptTokens: 10, completionTokens: 32 },
  })
)

mock.module('@mistralai/mistralai', () => ({
  Mistral: class MockMistral {
    chat = { complete: mockMistralComplete }
  },
}))

const mockGroqCreate = mock((): Promise<any> =>
  Promise.resolve({
    choices: [{ message: { content: 'Groq response', tool_calls: undefined } }],
    usage: { total_tokens: 20, prompt_tokens: 8, completion_tokens: 12 },
  })
)

mock.module('groq-sdk', () => ({
  default: class MockGroq {
    chat = { completions: { create: mockGroqCreate } }
  },
}))

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

import { AiClient, AiCircuitBreakerError } from '../src/helpers/aiClient'

describe('AiClient', () => {
  let client: AiClient

  beforeEach(() => {
    mockMistralComplete.mockReset()
    mockMistralComplete.mockImplementation(() =>
      Promise.resolve({
        choices: [
          {
            message: { content: 'Hello!', toolCalls: undefined },
            finishReason: 'stop',
          },
        ],
        usage: { totalTokens: 42, promptTokens: 10, completionTokens: 32 },
      })
    )
    mockGroqCreate.mockReset()
    mockGroqCreate.mockImplementation(() =>
      Promise.resolve({
        choices: [
          { message: { content: 'Groq response', tool_calls: undefined } },
        ],
        usage: { total_tokens: 20, prompt_tokens: 8, completion_tokens: 12 },
      })
    )
    AiClient.resetCircuit()
    AiClient.setRetryDelay(1)
    client = new AiClient({
      mistralApiKey: 'test-mistral-key',
      groqApiKey: 'test-groq-key',
      model: 'mistral-small-latest',
      timeout: 30000,
    })
  })

  test('basic chat response from Mistral', async () => {
    const result = await client.generateResponse(
      'You are helpful',
      [],
      'Hello',
      1000,
      0.7
    )

    expect(result.text).toBe('Hello!')
    expect(result.tokensUsed).toBe(42)
    expect(result.promptTokens).toBe(10)
    expect(result.completionTokens).toBe(32)
    expect(result.latency).toBeGreaterThanOrEqual(0)
  })

  test('tool call parsing from Mistral camelCase response', async () => {
    mockMistralComplete.mockImplementationOnce(() =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: 'I will timeout that user.',
              toolCalls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'timeout',
                    arguments: '{"user":"123","duration":60}',
                  },
                },
              ],
            },
            finishReason: 'tool_calls',
          },
        ],
        usage: { totalTokens: 50, promptTokens: 20, completionTokens: 30 },
      })
    )

    const result = await client.generateResponse(
      'System prompt',
      [],
      'Timeout user 123',
      1000,
      0.7
    )

    expect(result.toolCalls).toBeDefined()
    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls?.[0].id).toBe('call_1')
    expect(result.toolCalls?.[0].type).toBe('function')
    expect(result.toolCalls?.[0].function.name).toBe('timeout')
    expect(result.toolCalls?.[0].function.arguments).toBe(
      '{"user":"123","duration":60}'
    )
  })

  test('circuit breaker opens after repeated failures', async () => {
    AiClient.resetCircuit()

    // Create client without Groq so Mistral failure is terminal
    const noFallbackClient = new AiClient({
      mistralApiKey: 'test-key',
      model: 'mistral-small-latest',
      timeout: 30000,
    })

    mockMistralComplete.mockImplementation(() => {
      const error: any = new Error('Server error')
      error.status = 500
      return Promise.reject(error)
    })

    // 5 failures to open the circuit (each retries internally but all retries fail too)
    for (let i = 0; i < 5; i++) {
      try {
        await noFallbackClient.generateResponse(
          'System',
          [],
          'Hello',
          1000,
          0.7
        )
      } catch {
        // Expected
      }
    }

    mockMistralComplete.mockClear()

    await expect(
      noFallbackClient.generateResponse('System', [], 'Hello', 1000, 0.7)
    ).rejects.toBeInstanceOf(AiCircuitBreakerError)

    expect(mockMistralComplete).not.toHaveBeenCalled()
    AiClient.resetCircuit()
  })

  test('retry on 429 and succeeds', async () => {
    let callCount = 0
    mockMistralComplete.mockImplementation(() => {
      callCount++
      if (callCount <= 2) {
        const error: any = new Error('Rate limited')
        error.status = 429
        return Promise.reject(error)
      }
      return Promise.resolve({
        choices: [
          {
            message: { content: 'Success after retry', toolCalls: undefined },
            finishReason: 'stop',
          },
        ],
        usage: { totalTokens: 10, promptTokens: 5, completionTokens: 5 },
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

  test('Groq fallback on Mistral failure', async () => {
    mockMistralComplete.mockImplementation(() =>
      Promise.reject(new Error('Mistral is down'))
    )

    const result = await client.generateResponse(
      'System',
      [],
      'Hello',
      1000,
      0.7
    )

    expect(result.text).toBe('Groq response')
    expect(result.tokensUsed).toBe(20)
    expect(result.promptTokens).toBe(8)
    expect(result.completionTokens).toBe(12)
  })

  test('Groq fallback parses snake_case tool_calls correctly', async () => {
    mockMistralComplete.mockImplementation(() =>
      Promise.reject(new Error('Mistral is down'))
    )
    mockGroqCreate.mockImplementationOnce(() =>
      Promise.resolve({
        choices: [{
          message: {
            content: 'I will do that.',
            tool_calls: [{
              id: 'groq_call_1',
              type: 'function',
              function: {
                name: 'ban_user',
                arguments: '{"userId":"456"}',
              },
            }],
          },
        }],
        usage: { total_tokens: 30, prompt_tokens: 15, completion_tokens: 15 },
      })
    )

    const result = await client.generateResponse('System', [], 'Ban user 456', 1000, 0.7)

    expect(result.toolCalls).toBeDefined()
    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls?.[0].id).toBe('groq_call_1')
    expect(result.toolCalls?.[0].type).toBe('function')
    expect(result.toolCalls?.[0].function.name).toBe('ban_user')
    expect(result.toolCalls?.[0].function.arguments).toBe('{"userId":"456"}')
  })

  test('timeout handling', async () => {
    const shortTimeoutClient = new AiClient({
      mistralApiKey: 'test-key',
      model: 'mistral-small-latest',
      timeout: 10,
    })

    mockMistralComplete.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5000))
    )

    await expect(
      shortTimeoutClient.generateResponse('System', [], 'Hello', 1000, 0.7)
    ).rejects.toThrow('API timeout')
  })

  test('image handling selects pixtral-large-latest model', async () => {
    // Mock global fetch for image fetching
    const originalFetch = globalThis.fetch
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(Buffer.from('fake-image-data'), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        })
      )
    ) as any

    try {
      await client.generateResponse(
        'System',
        [],
        'What is this?',
        1000,
        0.7,
        [{ url: 'https://example.com/image.png', mimeType: 'image/png', isVideo: false, isGif: false }]
      )

      const callArgs = (mockMistralComplete.mock.calls[0] as any[])[0]
      expect(callArgs.model).toBe('pixtral-large-latest')

      // Verify image_url format in the user message
      const userMsg = callArgs.messages[callArgs.messages.length - 1]
      expect(userMsg.content).toBeInstanceOf(Array)
      const imageContent = userMsg.content.find(
        (c: any) => c.type === 'image_url'
      )
      expect(imageContent).toBeDefined()
      expect(imageContent.image_url.url).toMatch(
        /^data:image\/png;base64,/
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('unsupported media type skipped with warning', async () => {
    const warnCalls: string[] = []
    const { default: Logger } = await import('../src/helpers/Logger')
    const origWarn = Logger.warn
    Logger.warn = (msg: string) => warnCalls.push(msg)

    try {
      await client.generateResponse(
        'System',
        [],
        'Check this video',
        1000,
        0.7,
        [{ url: 'https://example.com/video.mp4', mimeType: 'video/mp4', isVideo: true, isGif: false }]
      )

      expect(warnCalls.some((m) => m.includes('Unsupported media type'))).toBe(
        true
      )
    } finally {
      Logger.warn = origWarn
    }
  })

  test('empty text defaults to empty string', async () => {
    mockMistralComplete.mockImplementationOnce(() =>
      Promise.resolve({
        choices: [
          {
            message: { content: undefined, toolCalls: undefined },
            finishReason: 'stop',
          },
        ],
        usage: { totalTokens: 5, promptTokens: 3, completionTokens: 2 },
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

  test('Mistral tool call with object arguments is JSON-stringified', async () => {
    mockMistralComplete.mockImplementationOnce(() =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: '',
              toolCalls: [
                {
                  id: 'call_obj',
                  type: 'function',
                  function: {
                    name: 'do_thing',
                    arguments: { key: 'value', num: 1 },
                  },
                },
              ],
            },
            finishReason: 'tool_calls',
          },
        ],
        usage: { totalTokens: 10, promptTokens: 5, completionTokens: 5 },
      })
    )

    const result = await client.generateResponse(
      'System',
      [],
      'Do the thing',
      1000,
      0.7
    )

    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls?.[0].function.arguments).toBe(
      '{"key":"value","num":1}'
    )
  })

  test('Groq tool call with object arguments is JSON-stringified', async () => {
    mockMistralComplete.mockImplementation(() =>
      Promise.reject(new Error('Mistral is down'))
    )
    mockGroqCreate.mockImplementationOnce(() =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'groq_obj',
                  type: 'function',
                  function: {
                    name: 'do_other',
                    arguments: { foo: 'bar' },
                  },
                },
              ],
            },
          },
        ],
        usage: { total_tokens: 10, prompt_tokens: 5, completion_tokens: 5 },
      })
    )

    const result = await client.generateResponse(
      'System',
      [],
      'Do the other thing',
      1000,
      0.7
    )

    expect(result.toolCalls).toHaveLength(1)
    expect(result.toolCalls?.[0].function.arguments).toBe('{"foo":"bar"}')
  })

  test('vision request does NOT fall back to Groq when Mistral fails', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(Buffer.from('fake-image-data'), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        })
      )
    ) as any

    mockMistralComplete.mockImplementation(() =>
      Promise.reject(new Error('Mistral vision error'))
    )

    try {
      await expect(
        client.generateResponse(
          'System',
          [],
          'What is this?',
          1000,
          0.7,
          [{ url: 'https://example.com/img.png', mimeType: 'image/png', isVideo: false, isGif: false }]
        )
      ).rejects.toThrow('Mistral vision error')

      expect(mockGroqCreate).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('vision request throws circuit breaker error when circuit is open', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(Buffer.from('fake-image-data'), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        })
      )
    ) as any

    // Open the circuit
    const noFallbackClient = new AiClient({
      mistralApiKey: 'test-key',
      model: 'mistral-small-latest',
      timeout: 30000,
    })
    mockMistralComplete.mockImplementation(() => {
      const error: any = new Error('Server error')
      error.status = 500
      return Promise.reject(error)
    })
    for (let i = 0; i < 5; i++) {
      try {
        await noFallbackClient.generateResponse('S', [], 'H', 1000, 0.7)
      } catch { /* expected */ }
    }

    // Now create a client WITH groq but send a vision request
    const visionClient = new AiClient({
      mistralApiKey: 'test-key',
      groqApiKey: 'test-groq-key',
      model: 'mistral-small-latest',
      timeout: 30000,
    })

    try {
      await expect(
        visionClient.generateResponse(
          'System',
          [],
          'What is this?',
          1000,
          0.7,
          [{ url: 'https://example.com/img.png', mimeType: 'image/png', isVideo: false, isGif: false }]
        )
      ).rejects.toBeInstanceOf(AiCircuitBreakerError)

      expect(mockGroqCreate).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = originalFetch
      AiClient.resetCircuit()
    }
  })

  test('Mistral receives camelCase toolCalls and toolCallId in history', async () => {
    const historyWithToolCalls: ChatMessage[] = [
      { role: 'user', content: 'check uptime' },
      {
        role: 'assistant',
        content: '',
        tool_calls: [
          { id: 'call_1', type: 'function', function: { name: 'uptime', arguments: '{}' } },
        ],
      },
      { role: 'tool', content: 'Uptime: 5h', tool_call_id: 'call_1', name: 'uptime' },
    ]

    mockMistralComplete.mockImplementation(() =>
      Promise.resolve({
        choices: [{ message: { content: 'Bot has been up for 5h.', toolCalls: undefined }, finishReason: 'stop' }],
        usage: { totalTokens: 30, promptTokens: 20, completionTokens: 10 },
      })
    )

    await client.generateResponse('System', historyWithToolCalls, '', 1000, 0.7)

    const sentMessages = (mockMistralComplete.mock.calls[0] as any[])[0]?.messages
    expect(sentMessages).toBeDefined()

    // assistant message must use camelCase toolCalls
    const assistantMsg = sentMessages.find((m: any) => m.role === 'assistant')
    expect(assistantMsg.toolCalls).toBeDefined()
    expect(assistantMsg.toolCalls[0].id).toBe('call_1')
    expect(assistantMsg.tool_calls).toBeUndefined()

    // tool message must use camelCase toolCallId
    const toolMsg = sentMessages.find((m: any) => m.role === 'tool')
    expect(toolMsg.toolCallId).toBe('call_1')
    expect(toolMsg.tool_call_id).toBeUndefined()
  })

  test('Groq tool_use_failed retries without tools and succeeds', async () => {
    mockMistralComplete.mockImplementation(() =>
      Promise.reject(new Error('Mistral is down'))
    )

    let groqCallCount = 0
    const groqCallArgs: any[][] = []
    mockGroqCreate.mockImplementation((...args: any[]) => {
      groqCallCount++
      groqCallArgs.push(args)
      if (groqCallCount === 1) {
        const error: any = new Error('tool_use_failed: invalid tool call')
        error.status = 400
        return Promise.reject(error)
      }
      return Promise.resolve({
        choices: [
          { message: { content: 'Text-only fallback', tool_calls: undefined } },
        ],
        usage: { total_tokens: 15, prompt_tokens: 7, completion_tokens: 8 },
      })
    })

    const tools: OpenAITool[] = [
      {
        type: 'function',
        function: {
          name: 'test_tool',
          description: 'A test tool',
          parameters: { type: 'object', properties: {} },
        },
      },
    ]

    const history: ChatMessage[] = [
      { role: 'user', content: 'Call the tool' },
      {
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            id: 'call_1',
            type: 'function',
            function: { name: 'test_tool', arguments: '{}' },
          },
        ],
      },
      { role: 'tool', content: 'tool result', tool_call_id: 'call_1' },
    ]

    const result = await client.generateResponse(
      'System',
      history,
      'Use the tool',
      1000,
      0.7,
      undefined,
      tools
    )

    expect(result.text).toBe('Text-only fallback')
    expect(groqCallCount).toBe(2)

    // The retry call (second) must have tool messages stripped
    const retryMessages: ChatMessage[] = groqCallArgs[1][0].messages
    const toolRoleMessages = retryMessages.filter(
      (m: ChatMessage) => m.role === 'tool'
    )
    expect(toolRoleMessages).toHaveLength(0)

    const assistantWithToolCalls = retryMessages.filter(
      (m: ChatMessage) => m.role === 'assistant' && m.tool_calls
    )
    expect(assistantWithToolCalls).toHaveLength(0)
  })
})

describe('Tool argument shape validation', () => {
  // Mirrors the guard in aiResponder.ts ~L553: rejects valid JSON that is not a plain object
  const isValidToolArgs = (raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw)
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    } catch {
      return false
    }
  }

  test('rejects null', () => {
    expect(isValidToolArgs('null')).toBe(false)
  })

  test('rejects array', () => {
    expect(isValidToolArgs('[1,2,3]')).toBe(false)
  })

  test('rejects string', () => {
    expect(isValidToolArgs('"hello"')).toBe(false)
  })

  test('rejects number', () => {
    expect(isValidToolArgs('42')).toBe(false)
  })

  test('accepts plain object', () => {
    expect(isValidToolArgs('{"key":"value"}')).toBe(true)
  })

  test('accepts empty object', () => {
    expect(isValidToolArgs('{}')).toBe(true)
  })

  test('rejects invalid JSON', () => {
    expect(isValidToolArgs('{broken')).toBe(false)
  })
})
