import { describe, test, expect, mock } from 'bun:test'

import { AiResponderService, MEMORY_TOOLS } from '../src/services/ai/aiResponder'

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
