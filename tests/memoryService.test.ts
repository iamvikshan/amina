import { describe, test, expect, mock, beforeEach } from 'bun:test'

// Track OpenAI instances by baseURL for per-provider assertions
const openaiInstances: Record<
  string,
  {
    chat: { completions: { create: ReturnType<typeof mock> } }
    embeddings: { create: ReturnType<typeof mock> }
  }
> = {}

// Default mock implementations
const defaultEmbeddingResult = {
  data: [{ embedding: new Array(1024).fill(0.1) }],
}
const defaultChatResult = {
  choices: [{ message: { content: '[]' } }],
}

void mock.module('openai', () => ({
  default: class MockOpenAI {
    chat: any
    embeddings: any
    constructor({ baseURL }: { baseURL: string }) {
      const instance = {
        chat: {
          completions: {
            create: mock(() => Promise.resolve({ ...defaultChatResult })),
          },
        },
        embeddings: {
          create: mock(() =>
            Promise.resolve({ ...defaultEmbeddingResult })
          ),
        },
      }
      this.chat = instance.chat
      this.embeddings = instance.embeddings
      openaiInstances[baseURL] = instance
    }
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

void mock.module('../src/helpers/Logger', () => ({
  default: mockLogger,
  Logger: mockLogger,
  success: mockLogger.success,
  log: mockLogger.log,
  warn: mockLogger.warn,
  error: mockLogger.error,
  debug: mockLogger.debug,
}))

void mock.module('@helpers/Logger', () => ({
  default: mockLogger,
  Logger: mockLogger,
  success: mockLogger.success,
  log: mockLogger.log,
  warn: mockLogger.warn,
  error: mockLogger.error,
  debug: mockLogger.debug,
}))

// Mock database schemas
type SavedMemoryPayload = {
  userId: string
  guildId: string | null
  memoryType: string
  key: string
  value: string
  context: string
  importance: number
  embedding?: number[]
  vectorId?: string
}

const mockSaveMemory = mock(
  (_payload: SavedMemoryPayload): Promise<void> => Promise.resolve()
)
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

void mock.module('../src/database/schemas/AiMemory', () => ({
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

import { MemoryService } from '../src/services/ai/memoryService'

describe('MemoryService (new SDK)', () => {
  let service: MemoryService

  const getMock = (url: string) => openaiInstances[url]

  beforeEach(async () => {
    // Clear instance registry
    for (const key of Object.keys(openaiInstances)) delete openaiInstances[key]

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
      geminiApiKey: 'test-gemini-key',
      mistralApiKey: 'test-mistral-key',
      voyageApiKey: 'test-voyage-key',
      voyageMongoApiKey: 'test-voyage-mongo-key',
      embeddingModel: 'voyage-4-lite',
    })
  })

  test('embedding uses Voyage provider via OpenAI SDK', async () => {
    const fact = { key: 'test_key', value: 'test_value', importance: 5 }
    await service.storeMemory(fact, 'user123', 'guild456', 'test context')

    // One of the Voyage clients should have been called
    const voyageNative = getMock('https://api.voyageai.com/v1')
    const voyageMongo = getMock('https://ai.mongodb.com/v1')
    const voyageCalls =
      voyageNative.embeddings.create.mock.calls.length +
      voyageMongo.embeddings.create.mock.calls.length
    expect(voyageCalls).toBe(1)
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

    // Verify one of the Voyage clients was used for embedding
    const voyageNative = getMock('https://api.voyageai.com/v1')
    const voyageMongo = getMock('https://ai.mongodb.com/v1')
    const embCalls =
      voyageNative.embeddings.create.mock.calls.length +
      voyageMongo.embeddings.create.mock.calls.length
    expect(embCalls).toBe(1)

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
      voyageApiKey: 'test-voyage-key',
      embeddingModel: 'voyage-4-lite',
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

  test('embedding via Voyage AI uses OpenAI SDK', async () => {
    const fact = { key: 'test_key', value: 'test_value', importance: 5 }
    await service.storeMemory(fact, 'user123', 'guild456', 'test context')

    // One of the two Voyage clients should have been called
    const voyageNative = getMock('https://api.voyageai.com/v1')
    const voyageMongo = getMock('https://ai.mongodb.com/v1')
    const nativeCalls = voyageNative.embeddings.create.mock.calls.length
    const mongoCalls = voyageMongo.embeddings.create.mock.calls.length
    expect(nativeCalls + mongoCalls).toBe(1)

    // Check whichever was called
    const calledMock = nativeCalls > 0 ? voyageNative : voyageMongo
    const callArgs = calledMock.embeddings.create.mock.calls[0][0] as any
    expect(callArgs.model).toBe('voyage-4-lite')
    expect(callArgs.input).toEqual(['test_key: test_value'])

    // Mistral should NOT be called when Voyage succeeds
    const mistral = getMock('https://api.mistral.ai/v1')
    expect(mistral.embeddings.create).not.toHaveBeenCalled()
  })

  test('embedding falls back to Gemini when both Voyage clients fail', async () => {
    // Make both Voyage clients reject
    const voyageNative = getMock('https://api.voyageai.com/v1')
    const voyageMongo = getMock('https://ai.mongodb.com/v1')
    voyageNative.embeddings.create.mockImplementation(() =>
      Promise.reject(new Error('Voyage native failed'))
    )
    voyageMongo.embeddings.create.mockImplementation(() =>
      Promise.reject(new Error('Voyage mongo failed'))
    )

    const fact = { key: 'test_key', value: 'test_value', importance: 5 }
    await service.storeMemory(fact, 'user123', 'guild456', 'test context')

    // Gemini should be called as fallback
    const gemini = getMock('https://generativelanguage.googleapis.com/v1beta/openai/')
    expect(gemini.embeddings.create).toHaveBeenCalledTimes(1)
    const callArgs = gemini.embeddings.create.mock.calls[0][0] as any
    expect(callArgs.model).toBe('gemini-embedding-001')
    expect(callArgs.dimensions).toBe(1024)

    // Mistral should NOT be called when Gemini succeeds
    const mistral = getMock('https://api.mistral.ai/v1')
    expect(mistral.embeddings.create).not.toHaveBeenCalled()
  })

  test('embedding falls back to Mistral when Voyage and Gemini both fail', async () => {
    // Make Voyage clients reject
    const voyageNative = getMock('https://api.voyageai.com/v1')
    const voyageMongo = getMock('https://ai.mongodb.com/v1')
    voyageNative.embeddings.create.mockImplementation(() =>
      Promise.reject(new Error('Voyage native failed'))
    )
    voyageMongo.embeddings.create.mockImplementation(() =>
      Promise.reject(new Error('Voyage mongo failed'))
    )
    // Make Gemini reject too
    const gemini = getMock('https://generativelanguage.googleapis.com/v1beta/openai/')
    gemini.embeddings.create.mockImplementation(() =>
      Promise.reject(new Error('Gemini embedding failed'))
    )

    const fact = { key: 'test_key', value: 'test_value', importance: 5 }
    await service.storeMemory(fact, 'user123', 'guild456', 'test context')

    // Mistral should be called as last-resort fallback
    const mistral = getMock('https://api.mistral.ai/v1')
    expect(mistral.embeddings.create).toHaveBeenCalledTimes(1)
    const callArgs = mistral.embeddings.create.mock.calls[0][0] as any
    expect(callArgs.model).toBe('mistral-embed')
    // dimensions must NOT be passed to Mistral
    expect(callArgs.dimensions).toBeUndefined()
  })

  test('storeMemory fails when no embedding providers available', async () => {
    const noKeyService = new MemoryService()
    await noKeyService.initialize({
      embeddingModel: 'voyage-4-lite',
    })

    const fact = { key: 'test', value: 'val', importance: 5 }
    const result = await noKeyService.storeMemory(
      fact,
      'user1',
      null,
      'ctx'
    )
    expect(result).toBe(false)
  })

  test('storeMemory uses input_type document', async () => {
    const fact = { key: 'food', value: 'pizza', importance: 5 }
    await service.storeMemory(fact, 'user1', null, 'ctx')

    // Check whichever Voyage client was called
    const voyageNative = getMock('https://api.voyageai.com/v1')
    const voyageMongo = getMock('https://ai.mongodb.com/v1')
    const calledMock =
      voyageNative.embeddings.create.mock.calls.length > 0
        ? voyageNative
        : voyageMongo
    const callArgs = calledMock.embeddings.create.mock.calls[0][0] as any
    expect(callArgs.input_type).toBe('document')
  })

  test('recallMemories uses input_type query', async () => {
    mockVectorSearch.mockImplementationOnce(() => Promise.resolve([]))

    await service.recallMemories('What is my name?', 'user1', null, 5)

    // Check whichever Voyage client was called
    const voyageNative = getMock('https://api.voyageai.com/v1')
    const voyageMongo = getMock('https://ai.mongodb.com/v1')
    const calledMock =
      voyageNative.embeddings.create.mock.calls.length > 0
        ? voyageNative
        : voyageMongo
    const callArgs = calledMock.embeddings.create.mock.calls[0][0] as any
    expect(callArgs.input_type).toBe('query')
  })
})
