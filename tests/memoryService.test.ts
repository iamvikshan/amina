import { describe, test, expect, mock, beforeEach } from 'bun:test'

// Mock the @mistralai/mistralai module
const mockMistralChat = mock((): Promise<any> =>
  Promise.resolve({
    choices: [{ message: { content: '[]' } }],
  })
)

const mockMistralEmbeddings = mock((): Promise<any> =>
  Promise.resolve({
    data: [{ embedding: new Array(1024).fill(0.1) }],
  })
)

mock.module('@mistralai/mistralai', () => ({
  Mistral: class MockMistral {
    embeddings = { create: mockMistralEmbeddings }
    chat = { complete: mockMistralChat }
  },
}))

// Mock Logger
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

// Mock database schemas
const mockSaveMemory = mock((): Promise<any> => Promise.resolve())
const mockGetUserMemories = mock((): Promise<any> => Promise.resolve([]))
const mockDeleteUserMemories = mock((): Promise<any> => Promise.resolve(0))
const mockGetMemoryStats = mock(
  (): Promise<any> => Promise.resolve({ total: 0, byType: [], topUsers: [] })
)
const mockPruneMemories = mock((): Promise<any> => Promise.resolve(0))
const mockGetUserMemoryCount = mock((): Promise<any> => Promise.resolve(0))
const mockPruneLeastImportantMemories = mock(
  (): Promise<any> => Promise.resolve({ deletedCount: 0 })
)
const mockVectorSearch = mock((): Promise<any> => Promise.resolve([]))
const mockUpdateMany = mock((): Promise<any> => Promise.resolve({ modifiedCount: 0 }))
const mockFindSimilarMemory = mock((): Promise<any> => Promise.resolve(null))
const mockFindByIdAndUpdate = mock((): Promise<any> => Promise.resolve())

mock.module('../src/database/schemas/AiMemory', () => ({
  saveMemory: mockSaveMemory,
  getUserMemories: mockGetUserMemories,
  deleteUserMemories: mockDeleteUserMemories,
  getMemoryStats: mockGetMemoryStats,
  pruneMemories: mockPruneMemories,
  getUserMemoryCount: mockGetUserMemoryCount,
  pruneLeastImportantMemories: mockPruneLeastImportantMemories,
  vectorSearch: mockVectorSearch,
  findSimilarMemory: mockFindSimilarMemory,
  Model: {
    distinct: mock(() => Promise.resolve([])),
    aggregate: mock(() => Promise.resolve([])),
    updateMany: mockUpdateMany,
    findByIdAndUpdate: mockFindByIdAndUpdate,
  },
}))

import { MemoryService } from '../src/services/memoryService'

describe('MemoryService (new SDK)', () => {
  let service: MemoryService

  beforeEach(async () => {
    mockMistralEmbeddings.mockClear()
    mockMistralChat.mockClear()
    mockSaveMemory.mockClear()
    mockGetUserMemoryCount.mockClear()
    mockPruneLeastImportantMemories.mockClear()
    mockVectorSearch.mockClear()
    mockUpdateMany.mockClear()
    mockFindSimilarMemory.mockClear()
    mockFindByIdAndUpdate.mockClear()
    mockDeleteUserMemories.mockClear()
    mockGetUserMemories.mockClear()
    mockGetMemoryStats.mockClear()
    mockPruneMemories.mockClear()
    service = new MemoryService()
    await service.initialize({
      mistralApiKey: 'test-mistral-key',
      embeddingModel: 'mistral-embed',
      extractionModel: 'mistral-small-latest',
    })
  })

  test('embedding via Mistral SDK uses mistral.embeddings.create', async () => {
    const fact = { key: 'test_key', value: 'test_value', importance: 5 }
    await service.storeMemory(fact, 'user123', 'guild456', 'test context')

    expect(mockMistralEmbeddings).toHaveBeenCalledTimes(1)
    const callArgs = mockMistralEmbeddings.mock.calls[0][0] as any
    expect(callArgs.model).toBe('mistral-embed')
    expect(callArgs.inputs).toEqual(['test_key: test_value'])
  })

  test('embedding result is stored with saveMemory including embedding array', async () => {
    const fact = { key: 'name', value: 'Alice', importance: 8 }
    const result = await service.storeMemory(fact, 'user1', null, 'context')

    expect(result).toBe(true)

    expect(mockSaveMemory).toHaveBeenCalledTimes(1)
    const saveArgs = mockSaveMemory.mock.calls[0][0] as any
    expect(saveArgs.embedding).toEqual(new Array(1024).fill(0.1))
    expect(saveArgs.userId).toBe('user1')
    expect(saveArgs.guildId).toBeNull()
    expect(saveArgs.key).toBe('name')
    expect(saveArgs.value).toBe('Alice')
    expect(saveArgs.importance).toBe(8)
    expect(saveArgs.vectorId).toBeUndefined()
  })

  test('extraction uses mistral.chat.complete', async () => {
    const memoryJson =
      '[{"key": "name", "value": "Alice", "importance": 8, "memoryType": "user"}]'
    mockMistralChat.mockImplementationOnce(() =>
      Promise.resolve({
        choices: [{ message: { content: memoryJson } }],
      })
    )

    const fixedTimestamp = 1700000000000

    const messages = [
      {
        role: 'user' as const,
        content: 'My name is Alice',
        timestamp: fixedTimestamp,
        userId: 'u1',
        displayName: 'Alice',
      },
      {
        role: 'assistant' as const,
        content: 'Nice to meet you Alice!',
        timestamp: fixedTimestamp + 1000,
      },
      {
        role: 'user' as const,
        content: 'I like pizza',
        timestamp: fixedTimestamp + 2000,
        userId: 'u1',
        displayName: 'Alice',
      },
      {
        role: 'assistant' as const,
        content: 'Pizza is great!',
        timestamp: fixedTimestamp + 3000,
      },
    ]

    const facts = await service.extractMemories(messages)

    expect(mockMistralChat).toHaveBeenCalledTimes(1)
    const callArgs = mockMistralChat.mock.calls[0][0] as any
    expect(callArgs.model).toBe('mistral-small-latest')
    expect(Array.isArray(callArgs.messages)).toBe(true)
    expect(callArgs.messages[0].role).toBe('user')
    expect(typeof callArgs.messages[0].content).toBe('string')

    expect(facts).toHaveLength(1)
    expect(facts[0]).toEqual({
      key: 'name',
      value: 'Alice',
      importance: 8,
      memoryType: 'user',
    })
  })

  test('recallMemories uses vectorSearch with correct filter', async () => {
    const mockResults = [
      {
        _id: 'mem1',
        key: 'name',
        value: 'Alice',
        context: 'said her name',
        importance: 8,
        guildId: 'guild1',
        score: 0.95,
      },
      {
        _id: 'mem2',
        key: 'food',
        value: 'pizza',
        context: 'likes pizza',
        importance: 5,
        guildId: 'guild1',
        score: 0.8,
      },
    ]
    mockVectorSearch.mockImplementationOnce(() => Promise.resolve(mockResults))

    const memories = await service.recallMemories(
      'What is my name?',
      'user1',
      'guild1',
      5
    )

    expect(mockMistralEmbeddings).toHaveBeenCalledTimes(1)

    // Verify vectorSearch was called with the right params
    expect(mockVectorSearch).toHaveBeenCalledTimes(1)
    const [queryVector, filter, limit] = mockVectorSearch.mock.calls[0] as any
    expect(queryVector).toEqual(new Array(1024).fill(0.1))
    expect(filter.userId).toBe('user1')
    // Overfetch to compensate for DM post-filtering (Math.max(5*2, 5+10) = 15)
    expect(limit).toBe(15)

    // Default prefs: global server mode — no guildId filter applied
    expect(filter.guildId).toBeUndefined()

    // Verify returned memories
    expect(memories).toHaveLength(2)
    expect(memories[0].key).toBe('name')
    expect(memories[0].value).toBe('Alice')
    expect(memories[0].score).toBe(0.95)
    expect(memories[0].context).toBe('said her name')
    expect(memories[1].key).toBe('food')

    // Verify bulk access tracking
    expect(mockUpdateMany).toHaveBeenCalledTimes(1)
  })

  test('recallMemories DM context filters guildId to null', async () => {
    mockVectorSearch.mockImplementationOnce(() => Promise.resolve([]))

    await service.recallMemories('hello', 'user1', null, 5)

    expect(mockVectorSearch).toHaveBeenCalledTimes(1)
    const [, filter] = mockVectorSearch.mock.calls[0] as any
    expect(filter.userId).toBe('user1')
    expect(filter.guildId).toBeNull()
  })

  test('forgetUser calls deleteUserMemories directly', async () => {
    mockDeleteUserMemories.mockImplementationOnce(() => Promise.resolve(3))

    const count = await service.forgetUser('user1', 'guild1')

    expect(count).toBe(3)
    expect(mockDeleteUserMemories).toHaveBeenCalledWith('user1', 'guild1')
  })

  test('prunes oldest memories when over limit', async () => {
    mockGetUserMemoryCount.mockImplementationOnce(() => Promise.resolve(60))
    mockPruneLeastImportantMemories.mockImplementationOnce(() =>
      Promise.resolve({ deletedCount: 10 })
    )

    const fact = { key: 'test', value: 'test', importance: 5 }
    await service.storeMemory(fact, 'user1', null, 'ctx')

    expect(mockPruneLeastImportantMemories).toHaveBeenCalledTimes(1)
  })

  test('storeMemory merges with existing memory above dedup threshold', async () => {
    // Existing similar memory found
    mockFindSimilarMemory.mockImplementationOnce(() =>
      Promise.resolve({
        _id: 'existing-mem-id',
        key: 'favorite_food',
        value: 'pizza',
        context: 'mentioned earlier',
        importance: 6,
        score: 0.92,
      })
    )

    const fact = {
      key: 'favorite_food',
      value: 'pepperoni pizza',
      importance: 8,
    }
    const result = await service.storeMemory(
      fact,
      'user1',
      'guild1',
      'updated context'
    )

    expect(result).toBe(true)
    // Verify findSimilarMemory was called with memoryType
    expect(mockFindSimilarMemory).toHaveBeenCalledTimes(1)
    const [, , , memType] = mockFindSimilarMemory.mock.calls[0] as any
    expect(memType).toBe('user') // default memoryType
    // Should NOT create a new memory
    expect(mockSaveMemory).not.toHaveBeenCalled()
    // Should update existing memory
    expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(1)
    const [id, update] = mockFindByIdAndUpdate.mock.calls[0] as any
    expect(id).toBe('existing-mem-id')
    expect(update.$set.value).toBe('pepperoni pizza')
    expect(update.$set.context).toBe('updated context')
    // Average importance: (6 + 8) / 2 = 7
    expect(update.$set.importance).toBe(7)
    expect(update.$inc.accessCount).toBe(1)
  })

  test('storeMemory creates new memory below dedup threshold', async () => {
    // Existing memory found but below threshold
    mockFindSimilarMemory.mockImplementationOnce(() =>
      Promise.resolve({
        _id: 'existing-mem-id',
        key: 'hobby',
        value: 'reading',
        context: 'some context',
        importance: 5,
        score: 0.6, // Below 0.85 threshold
      })
    )

    const fact = { key: 'favorite_color', value: 'blue', importance: 5 }
    const result = await service.storeMemory(fact, 'user1', 'guild1', 'ctx')

    expect(result).toBe(true)
    // Should create a new memory (not merge)
    expect(mockSaveMemory).toHaveBeenCalledTimes(1)
    expect(mockFindByIdAndUpdate).not.toHaveBeenCalled()
  })

  test('storeMemory creates new memory when no similar exists', async () => {
    // No similar memory found
    mockFindSimilarMemory.mockImplementationOnce(() => Promise.resolve(null))

    const fact = { key: 'name', value: 'Bob', importance: 8 }
    const result = await service.storeMemory(fact, 'user1', null, 'intro')

    expect(result).toBe(true)
    expect(mockSaveMemory).toHaveBeenCalledTimes(1)
    expect(mockFindByIdAndUpdate).not.toHaveBeenCalled()
  })

  test('storeMemory skips dedup when threshold is 0', async () => {
    const noDedupService = new MemoryService()
    await noDedupService.initialize({
      mistralApiKey: 'test-key',
      dedupThreshold: 0,
    })

    const fact = { key: 'test', value: 'val', importance: 5 }
    await noDedupService.storeMemory(fact, 'user1', null, 'ctx')

    // findSimilarMemory should NOT be called when threshold is 0
    expect(mockFindSimilarMemory).not.toHaveBeenCalled()
    expect(mockSaveMemory).toHaveBeenCalledTimes(1)
  })

  test('merged memory importance is capped at 10', async () => {
    mockFindSimilarMemory.mockImplementationOnce(() =>
      Promise.resolve({
        _id: 'mem-id',
        key: 'fact',
        value: 'old',
        context: 'old ctx',
        importance: 10,
        score: 0.95,
      })
    )

    const fact = { key: 'fact', value: 'new', importance: 10 }
    await service.storeMemory(fact, 'user1', null, 'new ctx')

    const [, update] = mockFindByIdAndUpdate.mock.calls[0] as any
    expect(update.$set.importance).toBe(10) // (10+10)/2 = 10, capped at 10
  })

  test('merged memory importance has lower bound of 1', async () => {
    mockFindSimilarMemory.mockImplementationOnce(() =>
      Promise.resolve({
        _id: 'mem-id',
        key: 'fact',
        value: 'old',
        context: 'old ctx',
        importance: 1,
        score: 0.95,
      })
    )

    const fact = { key: 'fact', value: 'new', importance: 1 }
    await service.storeMemory(fact, 'user1', null, 'new ctx')

    const [, update] = mockFindByIdAndUpdate.mock.calls[0] as any
    expect(update.$set.importance).toBe(1) // (1+1)/2 = 1, floor at 1
  })

  test('storeMemory falls through to insert when dedup check fails', async () => {
    mockFindSimilarMemory.mockImplementationOnce(() =>
      Promise.reject(new Error('Atlas vector search unavailable'))
    )

    const fact = { key: 'test', value: 'val', importance: 5 }
    const result = await service.storeMemory(fact, 'user1', null, 'ctx')

    // Should succeed by falling through to normal insert
    expect(result).toBe(true)
    expect(mockSaveMemory).toHaveBeenCalledTimes(1)
    expect(mockFindByIdAndUpdate).not.toHaveBeenCalled()
  })
})
