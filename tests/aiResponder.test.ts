import { describe, test, expect, mock } from 'bun:test'

import { AiResponderService } from '../src/services/ai/aiResponder'

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
