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
mock.module('../src/database/schemas/AiMemory', () => ({
  saveMemory: mock(() => Promise.resolve()),
  getUserMemories: mock(() => Promise.resolve([])),
  updateMemoryAccess: mock(() => Promise.resolve()),
  deleteUserMemories: mock(() => Promise.resolve(0)),
  getMemoryStats: mock(() =>
    Promise.resolve({ total: 0, byType: [], topUsers: [] })
  ),
  pruneMemories: mock(() => Promise.resolve(0)),
  getUserMemoryCount: mock(() => Promise.resolve(0)),
  deleteOldestMemories: mock(() =>
    Promise.resolve({ deletedCount: 0, vectorIds: [] })
  ),
  Model: {
    distinct: mock(() => Promise.resolve([])),
    aggregate: mock(() => Promise.resolve([])),
  },
}))

// Mock @upstash/vector
const mockUpsert = mock(() => Promise.resolve())
const mockQuery = mock(() => Promise.resolve([]))
const mockDelete = mock(() => Promise.resolve())

mock.module('@upstash/vector', () => ({
  Index: class MockIndex {
    upsert = mockUpsert
    query = mockQuery
    delete = mockDelete
  },
}))

import { MemoryService } from '../src/services/memoryService'

describe('MemoryService (new SDK)', () => {
  let service: MemoryService

  beforeEach(async () => {
    mockEmbedContent.mockClear()
    mockGenerateContent.mockClear()
    mockUpsert.mockClear()
    mockQuery.mockClear()
    mockDelete.mockClear()
    service = new MemoryService()
    await service.initialize(
      'test-api-key',
      'https://test.upstash.io',
      'test-token',
      'text-embedding-005',
      'gemini-2.5-flash-lite'
    )
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

  test('embedding result extraction uses embeddings[0].values', async () => {
    const fact = { key: 'name', value: 'Alice', importance: 8 }
    const result = await service.storeMemory(fact, 'user1', null, 'context')

    // If the embedding extraction works, storeMemory should succeed
    expect(result).toBe(true)

    // Verify upsert was called with the embedding from embeddings[0].values
    expect(mockUpsert).toHaveBeenCalledTimes(1)
    const upsertArgs = mockUpsert.mock.calls[0][0] as any
    expect(upsertArgs.vector).toEqual(new Array(768).fill(0.1))
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

    const messages = [
      {
        role: 'user' as const,
        parts: [{ text: 'My name is Alice' }],
        timestamp: Date.now(),
        userId: 'u1',
        displayName: 'Alice',
      },
      {
        role: 'model' as const,
        parts: [{ text: 'Nice to meet you Alice!' }],
        timestamp: Date.now(),
      },
      {
        role: 'user' as const,
        parts: [{ text: 'I like pizza' }],
        timestamp: Date.now(),
        userId: 'u1',
        displayName: 'Alice',
      },
      {
        role: 'model' as const,
        parts: [{ text: 'Pizza is great!' }],
        timestamp: Date.now(),
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
})
