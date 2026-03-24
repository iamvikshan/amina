import { describe, test, expect, beforeEach, mock } from 'bun:test'
import { Model } from '../src/database/schemas/Conversation'
import type { Message as ConversationMessage } from '../src/structures/conversationBuffer'

// -----------------------------------------------------------------
// 1. Schema-level tests -- inspect the real Mongoose model/schema
// -----------------------------------------------------------------
describe('Conversation Persistence Schema', () => {
  test('schema defines conversationId as required, unique, and indexed', () => {
    const path = Model.schema.path('conversationId')
    expect(path).toBeDefined()
    expect(path.options.required).toBe(true)
    expect(path.options.unique).toBe(true)
    expect(path.options.index).toBe(true)
  })

  test('schema defines messages array with default empty', () => {
    const path = Model.schema.path('messages')
    expect(path).toBeDefined()
    const defaultVal =
      typeof path.options.default === 'function'
        ? path.options.default()
        : path.options.default
    expect(defaultVal).toEqual([])
  })

  test('schema defines lastActivity as Date', () => {
    const path = Model.schema.path('lastActivity')
    expect(path).toBeDefined()
    expect(path.instance).toBe('Date')
  })

  test('schema has TTL index on lastActivity with 30 minute expiry', () => {
    const indexes = Model.schema.indexes()
    const ttlIndex = indexes.find(
      ([fields, opts]: any) =>
        fields.lastActivity !== undefined && opts?.expireAfterSeconds != null
    )
    expect(ttlIndex).toBeDefined()
    expect(ttlIndex?.[1].expireAfterSeconds).toBe(1800)
  })

  test('message sub-schema requires role and content', () => {
    const msgSchema = (Model.schema.path('messages') as any).schema
    expect(msgSchema).toBeDefined()

    const rolePath = msgSchema.path('role')
    expect(rolePath).toBeDefined()
    expect(rolePath.options.required).toBe(true)
    expect(rolePath.options.enum).toEqual(['user', 'assistant', 'tool', 'system'])

    const contentPath = msgSchema.path('content')
    expect(contentPath).toBeDefined()
  })

  test('message sub-schema includes optional user attribution fields', () => {
    const msgSchema = (Model.schema.path('messages') as any).schema
    expect(msgSchema.path('userId')).toBeDefined()
    expect(msgSchema.path('username')).toBeDefined()
    expect(msgSchema.path('displayName')).toBeDefined()
    expect(msgSchema.path('timestamp')).toBeDefined()
  })

  test('message sub-schema includes tool-related fields', () => {
    const msgSchema = (Model.schema.path('messages') as any).schema
    expect(msgSchema.path('tool_calls')).toBeDefined()
    expect(msgSchema.path('tool_call_id')).toBeDefined()
    expect(msgSchema.path('name')).toBeDefined()
  })
})

// -----------------------------------------------------------------
// 2. Mock the Conversation DB functions for ConversationBuffer tests
// -----------------------------------------------------------------
const mockUpsert = mock(() => Promise.resolve())
const mockLoad = mock(
  (
    _conversationId: string,
    _ttlMs?: number
  ): Promise<ConversationMessage[] | null> => Promise.resolve(null)
)
const mockDelete = mock(() => Promise.resolve())

mock.module('../src/database/schemas/Conversation', () => ({
  Model,
  upsertConversation: mockUpsert,
  loadConversation: mockLoad,
  deleteConversation: mockDelete,
}))

import { ConversationBuffer } from '../src/structures/conversationBuffer'

// -----------------------------------------------------------------
// 3. Integration tests -- ConversationBuffer with async getHistory
// -----------------------------------------------------------------
describe('ConversationBuffer with Persistence', () => {
  let buffer: ConversationBuffer

  beforeEach(() => {
    buffer = new ConversationBuffer()
    mockUpsert.mockClear()
    mockLoad.mockClear()
    mockDelete.mockClear()
  })

  test('getHistory returns empty array on cache miss when DB has no data', async () => {
    mockLoad.mockResolvedValueOnce(null)

    const history = await buffer.getHistory('nonexistent-conv')
    expect(history).toEqual([])

    buffer.shutdown()
  })

  test('getHistory reads from cache first before trying DB', async () => {
    buffer.append('test-conv', 'user', 'cached message')

    const history = await buffer.getHistory('test-conv')
    expect(history).toHaveLength(1)
    expect(history[0].content).toBe('cached message')

    expect(mockLoad).not.toHaveBeenCalled()

    buffer.shutdown()
  })

  test('getHistory restores conversation from DB on cache miss', async () => {
    const dbMessages = [
      { role: 'user' as const, content: 'restored msg', timestamp: 999 },
      { role: 'assistant' as const, content: 'restored reply', timestamp: 1000 },
    ]
    mockLoad.mockResolvedValueOnce(dbMessages)

    const history = await buffer.getHistory('restored-conv')
    expect(history).toHaveLength(2)
    expect(history[0].content).toBe('restored msg')
    expect(history[1].content).toBe('restored reply')

    // Subsequent call should hit cache, not DB
    mockLoad.mockClear()
    const history2 = await buffer.getHistory('restored-conv')
    expect(history2).toHaveLength(2)
    expect(mockLoad).not.toHaveBeenCalled()

    buffer.shutdown()
  })

  test('getHistory respects maxMessages on DB restore', async () => {
    const dbMessages = Array.from({ length: 10 }, (_, i) => ({
      role: 'user' as const,
      content: `msg ${i}`,
      timestamp: i,
    }))
    mockLoad.mockResolvedValueOnce(dbMessages)

    const history = await buffer.getHistory('big-conv', 3)
    expect(history).toHaveLength(3)
    expect(history[0].content).toBe('msg 7')

    buffer.shutdown()
  })

  test('append triggers fire-and-forget DB persistence', async () => {
    buffer.append('test-conv', 'user', 'test')

    const history = await buffer.getHistory('test-conv')
    expect(history).toHaveLength(1)

    // Wait for debounced persist
    await new Promise(resolve => setTimeout(resolve, 2500))
    expect(mockUpsert).toHaveBeenCalled()

    buffer.shutdown()
  })

  test('clear removes from cache and triggers DB delete', async () => {
    buffer.append('test-conv', 'user', 'to be cleared')
    buffer.clear('test-conv')

    const history = await buffer.getHistory('test-conv')
    expect(history).toEqual([])
    expect(mockDelete).toHaveBeenCalledWith('test-conv')

    buffer.shutdown()
  })

  test('getHistory handles DB load failure gracefully', async () => {
    mockLoad.mockRejectedValueOnce(new Error('DB connection failed'))

    const history = await buffer.getHistory('fail-conv')
    expect(history).toEqual([])

    buffer.shutdown()
  })

  test('shutdown clears pending persist timers', async () => {
    buffer.append('test-conv', 'user', 'test')
    buffer.shutdown()

    await new Promise(resolve => setTimeout(resolve, 2500))
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  test('TTL is 30 minutes', async () => {
    buffer.append('test-conv', 'user', 'old message')

    const entry = (buffer as any).cache.get('test-conv')
    entry.lastActivityAt = Date.now() - 31 * 60 * 1000

    const history = await buffer.getHistory('test-conv')
    expect(history).toEqual([])

    buffer.shutdown()
  })
})
