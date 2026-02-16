import { describe, test, expect, mock, beforeEach } from 'bun:test'

// Mock the @google/genai module
const mockGenerateContent = mock(() =>
  Promise.resolve({
    text: '[]',
    usageMetadata: { totalTokenCount: 10 },
    candidates: [{ content: { role: 'model', parts: [{ text: '[]' }] } }],
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

// Mock Logger
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

// Mock database schemas
const mockSaveMemory = mock(() => Promise.resolve())
const mockGetUserMemories = mock(() => Promise.resolve([]))
const mockDeleteUserMemories = mock(() => Promise.resolve(0))
const mockGetMemoryStats = mock(() =>
  Promise.resolve({ total: 0, byType: [], topUsers: [] })
)
const mockPruneMemories = mock(() => Promise.resolve(0))
const mockGetUserMemoryCount = mock(() => Promise.resolve(0))
const mockPruneLeastImportantMemories = mock(() =>
  Promise.resolve({ deletedCount: 0 })
)
const mockVectorSearch = mock(() => Promise.resolve([]))
const mockUpdateMany = mock(() => Promise.resolve({ modifiedCount: 0 }))
const mockFindSimilarMemory = mock(() => Promise.resolve(null))
const mockFindByIdAndUpdate = mock(() => Promise.resolve())

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
    mockEmbedContent.mockClear()
    mockGenerateContent.mockClear()
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
      authConfig: { mode: 'api-key', apiKey: 'test-api-key' },
      embeddingModel: 'gemini-embedding-001',
      extractionModel: 'gemini-2.5-flash-lite',
    })
  })

  test('embedding via new SDK uses ai.models.embedContent', async () => {
    // Store a memory to trigger embedding
    const fact = { key: 'test_key', value: 'test_value', importance: 5 }
    await service.storeMemory(fact, 'user123', 'guild456', 'test context')

    // Verify embedContent was called with correct shape
    expect(mockEmbedContent).toHaveBeenCalledTimes(1)
    const callArgs = mockEmbedContent.mock.calls[0][0] as any
    expect(callArgs.model).toBe('gemini-embedding-001')
    expect(callArgs.contents).toBe('test_key: test_value')
  })

  test('embedding result is stored with saveMemory including embedding array', async () => {
    const fact = { key: 'name', value: 'Alice', importance: 8 }
    const result = await service.storeMemory(fact, 'user1', null, 'context')

    // If the embedding extraction works, storeMemory should succeed
    expect(result).toBe(true)

    // Verify saveMemory was called with embedding (not vectorId)
    expect(mockSaveMemory).toHaveBeenCalledTimes(1)
    const saveArgs = mockSaveMemory.mock.calls[0][0] as any
    expect(saveArgs.embedding).toEqual(new Array(3072).fill(0.1))
    expect(saveArgs.userId).toBe('user1')
    expect(saveArgs.guildId).toBeNull()
    expect(saveArgs.key).toBe('name')
    expect(saveArgs.value).toBe('Alice')
    expect(saveArgs.importance).toBe(8)
    // vectorId should NOT be present
    expect(saveArgs.vectorId).toBeUndefined()
  })

  test('extraction uses ai.models.generateContent', async () => {
    const memoryJson =
      '[{"key": "name", "value": "Alice", "importance": 8, "memoryType": "user"}]'
    mockGenerateContent.mockImplementationOnce(() =>
      Promise.resolve({
        text: memoryJson,
        usageMetadata: { totalTokenCount: 20 },
        candidates: [
          { content: { role: 'model', parts: [{ text: memoryJson }] } },
        ],
      })
    )

    const fixedTimestamp = 1700000000000

    const messages = [
      {
        role: 'user' as const,
        parts: [{ text: 'My name is Alice' }],
        timestamp: fixedTimestamp,
        userId: 'u1',
        displayName: 'Alice',
      },
      {
        role: 'model' as const,
        parts: [{ text: 'Nice to meet you Alice!' }],
        timestamp: fixedTimestamp + 1000,
      },
      {
        role: 'user' as const,
        parts: [{ text: 'I like pizza' }],
        timestamp: fixedTimestamp + 2000,
        userId: 'u1',
        displayName: 'Alice',
      },
      {
        role: 'model' as const,
        parts: [{ text: 'Pizza is great!' }],
        timestamp: fixedTimestamp + 3000,
      },
    ]

    const facts = await service.extractMemories(messages)

    // Verify generateContent was called with correct shape
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
    const callArgs = mockGenerateContent.mock.calls[0][0] as any
    expect(callArgs.model).toBe('gemini-2.5-flash-lite')
    expect(typeof callArgs.contents).toBe('string') // extraction prompt is a string

    // Assert extracted memory facts
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

    // Verify embedContent was called for the query
    expect(mockEmbedContent).toHaveBeenCalledTimes(1)

    // Verify vectorSearch was called with the right params
    expect(mockVectorSearch).toHaveBeenCalledTimes(1)
    const [queryVector, filter, limit] = mockVectorSearch.mock.calls[0] as any
    expect(queryVector).toEqual(new Array(3072).fill(0.1))
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
    // Create a service with dedup disabled
    const noDedupService = new MemoryService()
    await noDedupService.initialize({
      authConfig: { mode: 'api-key', apiKey: 'test-key' },
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
