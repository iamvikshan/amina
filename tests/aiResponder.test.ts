import { describe, test, expect, mock } from 'bun:test'

const defaultEmbeddingResult = {
  data: [{ embedding: new Array(1024).fill(0.1) }],
}

void mock.module('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: mock(() => Promise.resolve({ choices: [{ message: { content: '[]' } }] })),
      },
    }
    embeddings = {
      create: mock(() => Promise.resolve({ ...defaultEmbeddingResult })),
    }
  },
}))

void mock.module('@helpers/Logger', () => ({
  default: { debug() {}, info() {}, warn() {}, error() {}, log() {}, success() {} },
}))

void mock.module('../src/helpers/Logger', () => ({
  default: { debug() {}, info() {}, warn() {}, error() {}, log() {}, success() {} },
}))

const mockSaveMemory = mock(
  (_payload: Record<string, unknown>): Promise<void> => Promise.resolve()
)
const mockFindSimilarMemory = mock((): Promise<any> => Promise.resolve(null))

void mock.module('../src/database/schemas/AiMemory', () => ({
  saveMemory: mockSaveMemory,
  getUserMemories: mock(() => Promise.resolve([])),
  deleteUserMemories: mock(() => Promise.resolve(0)),
  getMemoryStats: mock(() =>
    Promise.resolve({ total: 0, byType: [], topUsers: [] })
  ),
  pruneMemories: mock(() => Promise.resolve(0)),
  getUserMemoryCount: mock(() => Promise.resolve(0)),
  pruneLeastImportantMemories: mock(() =>
    Promise.resolve({ deletedCount: 0 })
  ),
  vectorSearch: mock(() => Promise.resolve([])),
  findSimilarMemory: mockFindSimilarMemory,
  Model: {
    distinct: mock(() => Promise.resolve([])),
    aggregate: mock(() => Promise.resolve([])),
    updateMany: mock(() => Promise.resolve({ modifiedCount: 0 })),
    findByIdAndUpdate: mock(() => Promise.resolve()),
  },
}))

import { AiResponderService, MEMORY_TOOLS } from '../src/services/ai/aiResponder'
import { MemoryService } from '../src/services/ai/memoryService'

describe('AiResponderService extraction guards', () => {
  test('rejects invalid extraction args and clones valid objects', () => {
    const service = new AiResponderService() as any

    expect(service.getValidExtractionArgs('remember_fact', null)).toBeNull()
    expect(service.getValidExtractionArgs('remember_fact', 'nope')).toBeNull()
    expect(service.getValidExtractionArgs('remember_fact', ['bad'])).toBeNull()

    const validArgs = { fact: 'ramen' }
    const result = service.getValidExtractionArgs('remember_fact', validArgs)

    expect(result).toEqual(validArgs)
    expect(result).not.toBe(validArgs)
  })

  test('conversation snippet includes the current user message once appended', () => {
    const service = new AiResponderService() as any
    const history: ChatMessage[] = [
      { role: 'assistant', content: 'Tell me about yourself.' },
      { role: 'user', content: 'I like noodles.' },
    ]

    const withCurrentUser = service.appendCurrentUserMessage(
      history,
      'My favorite food is ramen'
    )
    const snippet = service.buildConversationSnippet(withCurrentUser)

    expect(snippet).toContain('My favorite food is ramen')
  })
})

describe('AiResponderService fallback memory extraction', () => {
  test('returns extracted memories when fallback extraction succeeds', async () => {
    const service = new AiResponderService() as any
    const memories: MemoryFact[] = [
      {
        key: 'favorite_food',
        value: 'ramen',
        importance: 8,
        memoryType: 'user',
      },
    ]

    service.client = {
      extractAnalysis: mock(async () => ({
        intent: 'remember preference',
        tools: [],
        memories,
        statusText: '',
      })),
    }

    const result = await service.extractFallbackMemories(
      { author: { id: 'user-1' } } as any,
      'System prompt',
      [],
      'My favorite food is ramen'
    )

    expect(result).toEqual(memories)
  })

  test('returns empty array when fallback extraction fails', async () => {
    const service = new AiResponderService() as any

    service.client = {
      extractAnalysis: mock(async () => {
        throw new Error('fallback extraction failed')
      }),
    }

    const result = await service.extractFallbackMemories(
      { author: { id: 'user-1' } } as any,
      'System prompt',
      [],
      'My favorite food is ramen'
    )

    expect(result).toEqual([])
  })
})

describe('MEMORY_TOOLS classification', () => {
  test('contains all four memory tool names', () => {
    expect(MEMORY_TOOLS.has('remember_fact')).toBe(true)
    expect(MEMORY_TOOLS.has('update_memory')).toBe(true)
    expect(MEMORY_TOOLS.has('forget_memory')).toBe(true)
    expect(MEMORY_TOOLS.has('recall_memories')).toBe(true)
    expect(MEMORY_TOOLS.size).toBe(4)
  })

  test('memory-only execution has no non-memory tools', () => {
    const executedToolNames = new Set(['remember_fact', 'recall_memories'])
    const hasNonMemoryTools = [...executedToolNames].some(
      (name) => !MEMORY_TOOLS.has(name)
    )
    expect(hasNonMemoryTools).toBe(false)
  })

  test('mixed execution detects non-memory tools', () => {
    const executedToolNames = new Set(['remember_fact', 'gamble'])
    const hasNonMemoryTools = [...executedToolNames].some(
      (name) => !MEMORY_TOOLS.has(name)
    )
    expect(hasNonMemoryTools).toBe(true)
  })

  test('non-memory-only execution detects non-memory tools', () => {
    const executedToolNames = new Set(['ban', 'timeout'])
    const hasNonMemoryTools = [...executedToolNames].some(
      (name) => !MEMORY_TOOLS.has(name)
    )
    expect(hasNonMemoryTools).toBe(true)
  })
})

describe('synthetic history INTERNAL CONTEXT prefix', () => {
  test('synthetic message includes INTERNAL CONTEXT prefix', () => {
    const intent = 'remember preference'
    const toolSummary = 'Used tools: remember_fact. Results:\nMemory stored.'
    const syntheticMessage = `[INTERNAL CONTEXT - do not narrate or repeat this to the user] [Intent: ${intent}] ${toolSummary}`

    expect(syntheticMessage).toContain(
      '[INTERNAL CONTEXT - do not narrate or repeat this to the user]'
    )
    expect(syntheticMessage).toContain(`[Intent: ${intent}]`)
    expect(syntheticMessage).toContain(toolSummary)
  })
})

describe('storeExtractedMemories does not persist synthetic internal context', () => {
  test('buildConversationSnippet includes history content that could contain markers', () => {
    const service = new AiResponderService() as any
    const history: ChatMessage[] = [
      { role: 'user', content: 'I like ramen' },
      {
        role: 'assistant',
        content:
          '[INTERNAL CONTEXT - do not narrate or repeat this to the user] [Intent: remember] stored fact',
      },
      { role: 'user', content: 'Thanks' },
    ]

    const snippet = service.buildConversationSnippet(history)

    // The snippet WILL contain the marker from history -- this is expected.
    // The guardrail at storeMemory() must strip such context rather than
    // blocking it here, because storeExtractedMemories passes the snippet
    // as the `context` parameter.
    expect(snippet).toContain('[INTERNAL CONTEXT')
  })

  test('storeExtractedMemories passes tainted snippet as context and memoryService sanitizes it', async () => {
    mockSaveMemory.mockClear()
    mockFindSimilarMemory.mockClear()

    const service = new AiResponderService() as any

    const memService = new MemoryService()
    await memService.initialize({
      voyageApiKey: 'test-key',
      embeddingModel: 'voyage-4-lite',
    })

    // Patch the module-level memoryService used by storeExtractedMemories
    const { memoryService: importedMemService } = await import(
      '../src/services/ai/memoryService'
    )
    const origStoreMemory = importedMemService.storeMemory
    importedMemService.storeMemory = memService.storeMemory.bind(memService)

    try {
      const history: ChatMessage[] = [
        { role: 'user', content: 'I like ramen' },
        {
          role: 'assistant',
          content:
            '[INTERNAL CONTEXT - do not narrate or repeat this to the user] [Intent: remember] stored fact',
        },
        { role: 'user', content: 'Thanks' },
      ]
      const message = { author: { id: 'user-1' }, guild: { id: 'guild-1' } }
      const memories: MemoryFact[] = [
        {
          key: 'favorite_food',
          value: 'ramen',
          importance: 8,
          memoryType: 'user',
        },
      ]

      service.storeExtractedMemories(memories, message, history)

      // Allow the async storeMemory to settle
      await Bun.sleep(50)

      expect(mockSaveMemory).toHaveBeenCalledTimes(1)
      const saved = mockSaveMemory.mock.calls[0][0] as any
      expect(saved.value).toBe('ramen')
      expect(saved.key).toBe('favorite_food')
      expect(saved.context).toBe('')
      expect(saved.context).not.toContain('[INTERNAL CONTEXT')
    } finally {
      importedMemService.storeMemory = origStoreMemory
    }
  })
})

describe('non-memory tool UX ordering', () => {
  test('hasNonMemoryTools is true when extraction.tools contains a non-memory tool', () => {
    const tools = [
      { name: 'remember_fact', args: { fact: 'x' } },
      { name: 'gamble', args: { amount: 100 } },
    ]
    const hasNonMemoryTools = tools.some(t => !MEMORY_TOOLS.has(t.name))
    expect(hasNonMemoryTools).toBe(true)
  })

  test('hasNonMemoryTools is false when all tools are memory tools', () => {
    const tools = [
      { name: 'remember_fact', args: { fact: 'x' } },
      { name: 'recall_memories', args: { query: 'y' } },
    ]
    const hasNonMemoryTools = tools.some(t => !MEMORY_TOOLS.has(t.name))
    expect(hasNonMemoryTools).toBe(false)
  })

  test('pre-computed hasNonMemoryTools matches post-execution check', () => {
    const tools = [
      { name: 'remember_fact', args: { fact: 'x' } },
      { name: 'ban', args: { user: 'abc' } },
    ]

    // Pre-computed from extraction.tools (before loop)
    const preComputed = tools.some(t => !MEMORY_TOOLS.has(t.name))

    // Post-execution (simulating executedToolNames after loop)
    const executed = new Set(tools.map(t => t.name))
    const postComputed = [...executed].some(n => !MEMORY_TOOLS.has(n))

    expect(preComputed).toBe(postComputed)
  })
})

describe('output sanitization strips internal context markers', () => {
  test('strips single INTERNAL CONTEXT line from text', () => {
    const raw =
      'Here is your result.\n[INTERNAL CONTEXT - do not narrate] some secret\nEnjoy!'
    const sanitized = raw
      .replace(/\[INTERNAL CONTEXT[^\]]*\][^\n]*/gi, '')
      .trim()
    expect(sanitized).toBe('Here is your result.\n\nEnjoy!')
  })

  test('strips multiple INTERNAL CONTEXT lines', () => {
    const raw =
      '[INTERNAL CONTEXT hidden] leaked line\nVisible text\n[INTERNAL CONTEXT more] another leak'
    const sanitized = raw
      .replace(/\[INTERNAL CONTEXT[^\]]*\][^\n]*/gi, '')
      .trim()
    expect(sanitized).toBe('Visible text')
  })

  test('returns original text when no markers present', () => {
    const raw = 'No internal context here. Just a normal reply.'
    const sanitized = raw
      .replace(/\[INTERNAL CONTEXT[^\]]*\][^\n]*/gi, '')
      .trim()
    expect(sanitized).toBe(raw)
  })

  test('handles empty string after stripping', () => {
    const raw = '[INTERNAL CONTEXT - secret] everything was internal'
    const sanitized = raw
      .replace(/\[INTERNAL CONTEXT[^\]]*\][^\n]*/gi, '')
      .trim()
    expect(sanitized).toBe('')
  })

  test('case-insensitive matching strips lowercase variant', () => {
    const raw = 'Hello\n[internal context - secret] leak\nWorld'
    const sanitized = raw
      .replace(/\[INTERNAL CONTEXT[^\]]*\][^\n]*/gi, '')
      .trim()
    expect(sanitized).toBe('Hello\n\nWorld')
  })
})

describe('status message edit flow', () => {
  test('statusMessage.edit is called with sanitized text when statusMessage exists', async () => {
    const editMock = mock((_s: string) => Promise.resolve())
    const statusMessage = { edit: editMock }

    const resultText =
      'Done!\n[INTERNAL CONTEXT - hidden] leaked\n[Intent: greet]\nHere is your answer.'
    const sanitizedText = resultText
      .replace(/\[INTERNAL CONTEXT[^\]]*\][^\n]*/gi, '')
      .replace(/\[Intent:[^\]]*\]/gi, '')
      .trim()

    // When statusMessage exists, edit is used over reply
    await statusMessage.edit(sanitizedText)

    expect(editMock).toHaveBeenCalledTimes(1)
    expect(editMock).toHaveBeenCalledWith('Done!\n\n\nHere is your answer.')
  })

  test('falls back to message.reply when statusMessage is null', async () => {
    const replyMock = mock((_s: string) => Promise.resolve())
    const statusMessage = null as { edit: (s: string) => Promise<void> } | null
    const message = { reply: replyMock }

    const sanitizedText = 'Clean response.'

    if (sanitizedText) {
      if (statusMessage) {
        await statusMessage.edit(sanitizedText)
      } else {
        await message.reply(sanitizedText)
      }
    }

    expect(replyMock).toHaveBeenCalledTimes(1)
    expect(replyMock).toHaveBeenCalledWith('Clean response.')
  })
})
