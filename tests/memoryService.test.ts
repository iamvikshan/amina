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
    embeddings: [{ values: new Array(768).fill(0.1) }],
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
const mockDeleteOldestMemories = mock(() =>
  Promise.resolve({ deletedCount: 0 })
)
const mockVectorSearch = mock(() => Promise.resolve([]))
const mockUpdateMany = mock(() => Promise.resolve({ modifiedCount: 0 }))

mock.module('../src/database/schemas/AiMemory', () => ({
  saveMemory: mockSaveMemory,
  getUserMemories: mockGetUserMemories,
  deleteUserMemories: mockDeleteUserMemories,
  getMemoryStats: mockGetMemoryStats,
  pruneMemories: mockPruneMemories,
  getUserMemoryCount: mockGetUserMemoryCount,
  deleteOldestMemories: mockDeleteOldestMemories,
  vectorSearch: mockVectorSearch,
  Model: {
    distinct: mock(() => Promise.resolve([])),
    aggregate: mock(() => Promise.resolve([])),
    updateMany: mockUpdateMany,
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
    mockDeleteOldestMemories.mockClear()
    mockVectorSearch.mockClear()
    mockUpdateMany.mockClear()
    mockDeleteUserMemories.mockClear()
    mockGetUserMemories.mockClear()
    mockGetMemoryStats.mockClear()
    mockPruneMemories.mockClear()
    service = new MemoryService()
    await service.initialize({
      authConfig: { mode: 'api-key', apiKey: 'test-api-key' },
      embeddingModel: 'text-embedding-005',
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
    expect(callArgs.model).toBe('text-embedding-005')
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
    expect(saveArgs.embedding).toEqual(new Array(768).fill(0.1))
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

    const facts = await service.extractMemories(messages, 'u1', 'guild1')

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
    expect(queryVector).toEqual(new Array(768).fill(0.1))
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
    mockDeleteOldestMemories.mockImplementationOnce(() =>
      Promise.resolve({ deletedCount: 10 })
    )

    const fact = { key: 'test', value: 'test', importance: 5 }
    await service.storeMemory(fact, 'user1', null, 'ctx')

    expect(mockDeleteOldestMemories).toHaveBeenCalledTimes(1)
  })
})
