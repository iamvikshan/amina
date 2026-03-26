import { describe, test, expect, mock, beforeEach } from 'bun:test'

// -- Mocks must be declared before imports that use them --

const mockGeminiCreate = mock((): Promise<any> =>
  Promise.resolve({
    choices: [
      {
        message: { content: 'Hello!', tool_calls: undefined },
        finish_reason: 'stop',
      },
    ],
    usage: { total_tokens: 42, prompt_tokens: 10, completion_tokens: 32 },
  })
)

const mockMistralCreate = mock((): Promise<any> =>
  Promise.resolve({
    choices: [{ message: { content: 'Mistral response', tool_calls: undefined } }],
    usage: { total_tokens: 20, prompt_tokens: 8, completion_tokens: 12 },
  })
)

// Track which instances are created by baseURL
const openaiInstances: Record<string, { chat: { completions: { create: any } } }> = {}

void mock.module('openai', () => ({
  default: class MockOpenAI {
    chat: any
    constructor({ baseURL }: { baseURL: string }) {
      if (baseURL === 'https://generativelanguage.googleapis.com/v1beta/openai/') {
        this.chat = { completions: { create: mockGeminiCreate } }
      } else if (baseURL === 'https://api.mistral.ai/v1') {
        this.chat = { completions: { create: mockMistralCreate } }
      } else {
        this.chat = { completions: { create: mock() } }
      }
      openaiInstances[baseURL] = this as any
    }
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

void mock.module('../src/helpers/Logger', () => ({
  default: mockLogger,
  Logger: mockLogger,
  success: mockLogger.success,
  log: mockLogger.log,
  warn: mockLogger.warn,
  error: mockLogger.error,
  debug: mockLogger.debug,
}))

import { AiClient, AiCircuitBreakerError } from '../src/helpers/aiClient'

const captureRejection = async (
  operation: () => Promise<unknown>
): Promise<unknown> => {
  try {
    await operation()
  } catch (error) {
    return error
  }

  throw new Error('Expected operation to reject')
}

describe('AiClient', () => {
  let client: AiClient

  beforeEach(() => {
    mockGeminiCreate.mockReset()
    mockGeminiCreate.mockImplementation(() =>
      Promise.resolve({
        choices: [
          {
            message: { content: 'Hello!', tool_calls: undefined },
            finish_reason: 'stop',
          },
        ],
        usage: { total_tokens: 42, prompt_tokens: 10, completion_tokens: 32 },
      })
    )
    mockMistralCreate.mockReset()
    mockMistralCreate.mockImplementation(() =>
      Promise.resolve({
        choices: [
          { message: { content: 'Mistral response', tool_calls: undefined } },
        ],
        usage: { total_tokens: 20, prompt_tokens: 8, completion_tokens: 12 },
      })
    )
    AiClient.resetCircuit()
    AiClient.setRetryDelay(1)
    client = new AiClient({
      geminiApiKey: 'test-gemini-key',
      mistralApiKey: 'test-mistral-key',
      model: 'gemini-flash-latest',
      extractionModel: 'gemini-3.1-flash-lite-preview',
      timeout: 30000,
    })
  })

  test('basic chat response from Gemini', async () => {
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

  test('tool call parsing from Gemini response', async () => {
    mockGeminiCreate.mockImplementationOnce(() =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: 'I will timeout that user.',
              tool_calls: [
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
            finish_reason: 'tool_calls',
          },
        ],
        usage: { total_tokens: 50, prompt_tokens: 20, completion_tokens: 30 },
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

    // Create client without Mistral so Gemini failure is terminal
    const noFallbackClient = new AiClient({
      geminiApiKey: 'test-key',
      model: 'gemini-flash-latest',
      extractionModel: 'gemini-3.1-flash-lite-preview',
      timeout: 30000,
    })

    mockGeminiCreate.mockImplementation(() => {
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

    mockGeminiCreate.mockClear()

    const error = await captureRejection(() =>
      noFallbackClient.generateResponse('System', [], 'Hello', 1000, 0.7)
    )

    expect(error).toBeInstanceOf(AiCircuitBreakerError)

    expect(mockGeminiCreate).not.toHaveBeenCalled()
    AiClient.resetCircuit()
  })

  test('retry on 429 and succeeds', async () => {
    let callCount = 0
    mockGeminiCreate.mockImplementation(() => {
      callCount++
      if (callCount <= 2) {
        const error: any = new Error('Rate limited')
        error.status = 429
        return Promise.reject(error)
      }
      return Promise.resolve({
        choices: [
          {
            message: { content: 'Success after retry', tool_calls: undefined },
            finish_reason: 'stop',
          },
        ],
        usage: { total_tokens: 10, prompt_tokens: 5, completion_tokens: 5 },
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

  test('Mistral fallback on Gemini failure', async () => {
    mockGeminiCreate.mockImplementation(() =>
      Promise.reject(new Error('Gemini is down'))
    )

    const result = await client.generateResponse(
      'System',
      [],
      'Hello',
      1000,
      0.7
    )

    expect(result.text).toBe('Mistral response')
    expect(result.tokensUsed).toBe(20)
    expect(result.promptTokens).toBe(8)
    expect(result.completionTokens).toBe(12)
  })

  test('Mistral fallback parses snake_case tool_calls correctly', async () => {
    mockGeminiCreate.mockImplementation(() =>
      Promise.reject(new Error('Gemini is down'))
    )
    mockMistralCreate.mockImplementationOnce(() =>
      Promise.resolve({
        choices: [{
          message: {
            content: 'I will do that.',
            tool_calls: [{
              id: 'mistral_call_1',
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
    expect(result.toolCalls?.[0].id).toBe('mistral_call_1')
    expect(result.toolCalls?.[0].type).toBe('function')
    expect(result.toolCalls?.[0].function.name).toBe('ban_user')
    expect(result.toolCalls?.[0].function.arguments).toBe('{"userId":"456"}')
  })

  test('timeout handling', async () => {
    const shortTimeoutClient = new AiClient({
      geminiApiKey: 'test-key',
      model: 'gemini-flash-latest',
      extractionModel: 'gemini-3.1-flash-lite-preview',
      timeout: 10,
    })

    mockGeminiCreate.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5000))
    )

    const error = await captureRejection(() =>
      shortTimeoutClient.generateResponse('System', [], 'Hello', 1000, 0.7)
    )

    expect(error).toBeInstanceOf(Error)
    if (!(error instanceof Error)) {
      throw new Error('Expected timeout error')
    }
    expect(error.message).toContain('API timeout')
  })

  test('image handling uses current model for Gemini vision', async () => {
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

      const callArgs = (mockGeminiCreate.mock.calls[0] as any[])[0]
      expect(callArgs.model).toBe('gemini-flash-latest')

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
    mockGeminiCreate.mockImplementationOnce(() =>
      Promise.resolve({
        choices: [
          {
            message: { content: undefined, tool_calls: undefined },
            finish_reason: 'stop',
          },
        ],
        usage: { total_tokens: 5, prompt_tokens: 3, completion_tokens: 2 },
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

  test('Gemini tool call with object arguments is JSON-stringified', async () => {
    mockGeminiCreate.mockImplementationOnce(() =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
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
            finish_reason: 'tool_calls',
          },
        ],
        usage: { total_tokens: 10, prompt_tokens: 5, completion_tokens: 5 },
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

  test('Mistral fallback tool call with object arguments is JSON-stringified', async () => {
    mockGeminiCreate.mockImplementation(() =>
      Promise.reject(new Error('Gemini is down'))
    )
    mockMistralCreate.mockImplementationOnce(() =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: '',
              tool_calls: [
                {
                  id: 'mistral_obj',
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

  test('vision request does NOT fall back to Mistral when Gemini fails', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(Buffer.from('fake-image-data'), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        })
      )
    ) as any

    mockGeminiCreate.mockImplementation(() =>
      Promise.reject(new Error('Gemini vision error'))
    )

    try {
      const error = await captureRejection(() =>
        client.generateResponse(
          'System',
          [],
          'What is this?',
          1000,
          0.7,
          [{ url: 'https://example.com/img.png', mimeType: 'image/png', isVideo: false, isGif: false }]
        )
      )

      expect(error).toBeInstanceOf(Error)
      if (!(error instanceof Error)) {
        throw new Error('Expected Gemini vision error')
      }
      expect(error.message).toContain('Gemini vision error')

      expect(mockMistralCreate).not.toHaveBeenCalled()
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
      geminiApiKey: 'test-key',
      model: 'gemini-flash-latest',
      extractionModel: 'gemini-3.1-flash-lite-preview',
      timeout: 30000,
    })
    mockGeminiCreate.mockImplementation(() => {
      const error: any = new Error('Server error')
      error.status = 500
      return Promise.reject(error)
    })
    for (let i = 0; i < 5; i++) {
      try {
        await noFallbackClient.generateResponse('S', [], 'H', 1000, 0.7)
      } catch { /* expected */ }
    }

    // Now create a client WITH Mistral fallback but send a vision request
    const visionClient = new AiClient({
      geminiApiKey: 'test-key',
      mistralApiKey: 'test-mistral-key',
      model: 'gemini-flash-latest',
      extractionModel: 'gemini-3.1-flash-lite-preview',
      timeout: 30000,
    })

    try {
      const error = await captureRejection(() =>
        visionClient.generateResponse(
          'System',
          [],
          'What is this?',
          1000,
          0.7,
          [{ url: 'https://example.com/img.png', mimeType: 'image/png', isVideo: false, isGif: false }]
        )
      )

      expect(error).toBeInstanceOf(AiCircuitBreakerError)

      expect(mockMistralCreate).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = originalFetch
      AiClient.resetCircuit()
    }
  })

  test('Gemini sanitizes tool_calls history into plain text messages', async () => {
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

    mockGeminiCreate.mockImplementation(() =>
      Promise.resolve({
        choices: [{ message: { content: 'Bot has been up for 5h.', tool_calls: undefined }, finish_reason: 'stop' }],
        usage: { total_tokens: 30, prompt_tokens: 20, completion_tokens: 10 },
      })
    )

    await client.generateResponse('System', historyWithToolCalls, '', 1000, 0.7)

    const callArgs = (mockGeminiCreate.mock.calls[0] as any[])[0]
    const sentMessages: any[] = callArgs.messages

    // Sanitizer strips tool_calls from assistant and converts tool messages to user text
    const assistantMsg = sentMessages.find((m: any) => m.role === 'assistant')
    expect(assistantMsg.tool_calls).toBeUndefined()

    const toolMsg = sentMessages.find((m: any) => m.role === 'tool')
    expect(toolMsg).toBeUndefined()

    // Tool results should appear as a user message
    const toolResultUser = sentMessages.find(
      (m: any) => m.role === 'user' && m.content.includes('[Tool Results]')
    )
    expect(toolResultUser).toBeDefined()
    expect(toolResultUser.content).toContain('uptime')
    expect(toolResultUser.content).toContain('Uptime: 5h')
  })

  describe('extractAnalysis', () => {
    const validExtraction = JSON.stringify({
      intent: 'greeting',
      tools: [],
      memories: [],
      statusText: 'Thinking...',
    })

    test('returns parsed ExtractionResult from Gemini', async () => {
      mockGeminiCreate.mockImplementationOnce(() =>
        Promise.resolve({
          choices: [{ message: { content: validExtraction } }],
        })
      )

      const result = await client.extractAnalysis(
        'System prompt',
        [],
        'Hello there',
        '- greet: Say hello (params: none)'
      )

      expect(result.intent).toBe('greeting')
      expect(result.tools).toEqual([])
      expect(result.memories).toEqual([])
      expect(result.statusText).toBe('Thinking...')
    })

    test('falls back to Mistral on Gemini failure', async () => {
      mockGeminiCreate.mockImplementationOnce(() =>
        Promise.reject(new Error('Gemini down'))
      )
      mockMistralCreate.mockImplementationOnce(() =>
        Promise.resolve({
          choices: [{ message: { content: validExtraction } }],
        })
      )

      const result = await client.extractAnalysis(
        'System prompt',
        [],
        'Hello',
        ''
      )

      expect(result.intent).toBe('greeting')
      expect(mockMistralCreate).toHaveBeenCalled()
    })

    test('handles tools and memories in extraction', async () => {
      const withTools = JSON.stringify({
        intent: 'ban user',
        tools: [{ name: 'moderation_ban', args: { user: '123' } }],
        memories: [
          {
            key: 'name',
            value: 'Alice',
            importance: 8,
            memoryType: 'user',
          },
        ],
        statusText: 'On it...',
      })
      mockGeminiCreate.mockImplementationOnce(() =>
        Promise.resolve({
          choices: [{ message: { content: withTools } }],
        })
      )

      const result = await client.extractAnalysis(
        'System',
        [],
        'Ban user 123',
        ''
      )

      expect(result.tools).toHaveLength(1)
      expect(result.tools[0].name).toBe('moderation_ban')
      expect(result.tools[0].args).toEqual({ user: '123' })
      expect(result.memories).toHaveLength(1)
      expect(result.memories[0].key).toBe('name')
    })

    test('throws on malformed JSON from both providers', async () => {
      mockGeminiCreate.mockImplementationOnce(() =>
        Promise.resolve({
          choices: [{ message: { content: 'not json' } }],
        })
      )
      mockMistralCreate.mockImplementationOnce(() =>
        Promise.resolve({
          choices: [{ message: { content: 'also not json' } }],
        })
      )

      const error = await captureRejection(() =>
        client.extractAnalysis('System', [], 'Hello', '')
      )

      expect(error).toBeInstanceOf(Error)
    })
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
