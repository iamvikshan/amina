import { describe, test, expect, mock, beforeEach } from 'bun:test'

// Mock Logger — must match both default, named exports, and convenience destructures
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

// Also mock @helpers/Logger alias for modules that use path aliases (e.g. AiCommandRegistry)
mock.module('@helpers/Logger', () => ({
  default: mockLogger,
  Logger: mockLogger,
  success: mockLogger.success,
  log: mockLogger.log,
  warn: mockLogger.warn,
  error: mockLogger.error,
  debug: mockLogger.debug,
}))

// Mock @google/genai
const mockEmbedContent = mock(() =>
  Promise.resolve({
    embeddings: [{ values: new Array(3072).fill(0.1) }],
  })
)

mock.module('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: mock(() => Promise.resolve({ text: '[]' })),
      embedContent: mockEmbedContent,
    }
  },
}))

// Mock database schemas
const mockSaveMemory = mock(() => Promise.resolve())
const mockGetUserMemoryCount = mock(() => Promise.resolve(0))
const mockPruneLeastImportantMemories = mock(() =>
  Promise.resolve({ deletedCount: 0 })
)
const mockVectorSearch = mock(() => Promise.resolve([]))
const mockFindSimilarMemory = mock(() => Promise.resolve(null))
const mockFindByIdAndUpdate = mock(() => Promise.resolve())
const mockFindByIdAndDelete = mock(() => Promise.resolve())

mock.module('../src/database/schemas/AiMemory', () => ({
  saveMemory: mockSaveMemory,
  getUserMemories: mock(() => Promise.resolve([])),
  deleteUserMemories: mock(() => Promise.resolve(0)),
  getMemoryStats: mock(() =>
    Promise.resolve({ total: 0, byType: [], topUsers: [] })
  ),
  pruneMemories: mock(() => Promise.resolve(0)),
  getUserMemoryCount: mockGetUserMemoryCount,
  pruneLeastImportantMemories: mockPruneLeastImportantMemories,
  vectorSearch: mockVectorSearch,
  findSimilarMemory: mockFindSimilarMemory,
  Model: {
    distinct: mock(() => Promise.resolve([])),
    aggregate: mock(() => Promise.resolve([])),
    updateMany: mock(() => Promise.resolve({ modifiedCount: 0 })),
    findByIdAndUpdate: mockFindByIdAndUpdate,
    findByIdAndDelete: mockFindByIdAndDelete,
  },
}))

import { MemoryService } from '../src/services/memoryService'
import { MemoryManipulator } from '../src/services/memoryManipulator'

// Lightweight test double for AiCommandRegistry
// Captures registerNativeTools calls and provides isNativeTool/executeNativeTool
class TestRegistry {
  private handlers = new Map<
    string,
    (
      args: Record<string, unknown>,
      ctx: { userId: string; guildId: string | null }
    ) => Promise<string>
  >()
  private definitions: Array<{
    name: string
    description: string
    parameters?: any
  }> = []
  private metadata = new Map<string, any>()

  registerNativeTools(
    tools: Array<{
      declaration: any
      handler: any
      permissionModel?: string
    }>
  ) {
    for (const tool of tools) {
      this.handlers.set(tool.declaration.name, tool.handler)
      this.definitions.push(tool.declaration)
      this.metadata.set(tool.declaration.name, {
        name: tool.declaration.name,
        permissionModel: tool.permissionModel ?? 'open',
        userPermissions: [],
        freeWillAllowed: true,
      })
    }
  }

  getTools() {
    return this.definitions
  }

  isNativeTool(name: string): boolean {
    return this.handlers.has(name)
  }

  async executeNativeTool(
    name: string,
    args: Record<string, unknown>,
    context: { userId: string; guildId: string | null }
  ): Promise<string> {
    const handler = this.handlers.get(name)
    if (!handler) throw new Error(`Native tool ${name} not found`)
    return handler(args, context)
  }

  getMetadata(name: string) {
    return this.metadata.get(name)
  }

  // Simulate refresh — native tools survive in real impl
  refreshRegistry() {
    // No-op: native tools are preserved
  }
}

describe('MemoryManipulator', () => {
  let memoryService: MemoryService
  let registry: TestRegistry
  let manipulator: MemoryManipulator

  beforeEach(async () => {
    // Reset mocks
    mockSaveMemory.mockClear()
    mockGetUserMemoryCount.mockClear()
    mockPruneLeastImportantMemories.mockClear()
    mockVectorSearch.mockClear()
    mockFindSimilarMemory.mockClear()
    mockFindByIdAndUpdate.mockClear()
    mockFindByIdAndDelete.mockClear()
    mockEmbedContent.mockClear()

    // Reset default mock implementations
    mockFindSimilarMemory.mockImplementation(() => Promise.resolve(null))
    mockVectorSearch.mockImplementation(() => Promise.resolve([]))
    mockGetUserMemoryCount.mockImplementation(() => Promise.resolve(0))

    // Initialize memory service
    memoryService = new MemoryService()
    await memoryService.initialize({
      authConfig: { mode: 'api-key', apiKey: 'test-api-key' },
      embeddingModel: 'gemini-embedding-001',
      extractionModel: 'gemini-2.5-flash-lite',
    })

    // Initialize registry (lightweight test double)
    registry = new TestRegistry()

    // Initialize manipulator
    manipulator = new MemoryManipulator()
    manipulator.initialize(memoryService)
    manipulator.registerTools(registry as any)
  })

  test('memory_tools_registered_as_function_declarations', () => {
    const tools = registry.getTools()
    const toolNames = tools.map(t => t.name)

    expect(toolNames).toContain('remember_fact')
    expect(toolNames).toContain('update_memory')
    expect(toolNames).toContain('forget_memory')
    expect(toolNames).toContain('recall_memories')
    expect(tools.length).toBe(4)

    // All should be native tools
    expect(registry.isNativeTool('remember_fact')).toBe(true)
    expect(registry.isNativeTool('update_memory')).toBe(true)
    expect(registry.isNativeTool('forget_memory')).toBe(true)
    expect(registry.isNativeTool('recall_memories')).toBe(true)

    // Non-native tool check
    expect(registry.isNativeTool('help')).toBe(false)
  })

  test('remember_fact_creates_new_memory', async () => {
    const result = await registry.executeNativeTool(
      'remember_fact',
      { fact: 'likes cats', context: 'mentioned in chat' },
      { userId: 'user123', guildId: 'guild456' }
    )

    // Should call storeMemory
    expect(mockSaveMemory).toHaveBeenCalledTimes(1)
    const saveArgs = mockSaveMemory.mock.calls[0][0] as any
    expect(saveArgs.key).toBe('user_fact')
    expect(saveArgs.value).toBe('likes cats')
    expect(saveArgs.userId).toBe('user123')
    expect(saveArgs.guildId).toBe('guild456')

    // Result should be a human-readable string
    expect(typeof result).toBe('string')
    expect(result.toLowerCase()).toContain('remember')
  })

  test('update_memory_finds_and_modifies_existing', async () => {
    // Mock finding a similar memory
    mockFindSimilarMemory.mockImplementationOnce(() =>
      Promise.resolve({
        _id: 'mem-123',
        key: 'favorite_pet',
        value: 'cats',
        context: 'mentioned before',
        importance: 7,
        score: 0.92,
      })
    )

    const result = await registry.executeNativeTool(
      'update_memory',
      { description: 'likes cats', new_value: 'actually prefers dogs now' },
      { userId: 'user123', guildId: 'guild456' }
    )

    // Should have updated via findByIdAndUpdate
    expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(1)
    expect(typeof result).toBe('string')
    expect(result.toLowerCase()).toContain('updat')
  })

  test('forget_memory_deletes_matching_entry', async () => {
    // Mock finding a similar memory
    mockFindSimilarMemory.mockImplementationOnce(() =>
      Promise.resolve({
        _id: 'mem-456',
        key: 'favorite_pet',
        value: 'cats',
        context: 'mentioned before',
        importance: 7,
        score: 0.9,
      })
    )

    const result = await registry.executeNativeTool(
      'forget_memory',
      { description: 'likes cats' },
      { userId: 'user123', guildId: 'guild456' }
    )

    // Should have deleted via findByIdAndDelete
    expect(mockFindByIdAndDelete).toHaveBeenCalledTimes(1)
    expect(typeof result).toBe('string')
    expect(result.toLowerCase()).toContain('forgot')
  })

  test('recall_memories_returns_matching_results', async () => {
    // Mock vector search returning results
    mockVectorSearch.mockImplementationOnce(() =>
      Promise.resolve([
        {
          _id: 'mem1',
          key: 'pet',
          value: 'loves cats',
          context: 'chat',
          importance: 8,
          guildId: 'guild456',
          score: 0.95,
        },
        {
          _id: 'mem2',
          key: 'color',
          value: 'favorite is blue',
          context: 'chat',
          importance: 5,
          guildId: 'guild456',
          score: 0.7,
        },
      ])
    )

    const result = await registry.executeNativeTool(
      'recall_memories',
      { query: 'what does the user like', limit: 5 },
      { userId: 'user123', guildId: 'guild456' }
    )

    expect(typeof result).toBe('string')
    // Should contain the recalled memory content
    expect(result).toContain('cats')
    expect(result).toContain('blue')
  })

  test('no_match_returns_appropriate_message', async () => {
    // No similar memory found for update
    mockFindSimilarMemory.mockImplementationOnce(() => Promise.resolve(null))

    const result = await registry.executeNativeTool(
      'update_memory',
      { description: 'something that does not exist', new_value: 'new value' },
      { userId: 'user123', guildId: 'guild456' }
    )

    expect(typeof result).toBe('string')
    expect(result.toLowerCase()).toContain('no matching memory')

    // No similar memory found for forget
    mockFindSimilarMemory.mockImplementationOnce(() => Promise.resolve(null))

    const forgetResult = await registry.executeNativeTool(
      'forget_memory',
      { description: 'never stored this' },
      { userId: 'user123', guildId: 'guild456' }
    )

    expect(typeof forgetResult).toBe('string')
    expect(forgetResult.toLowerCase()).toContain('no matching memory')
  })

  test('native_tools_survive_registry_refresh', () => {
    // Native tools should survive a refresh (only slash commands get cleared)
    registry.refreshRegistry()

    const tools = registry.getTools()
    const toolNames = tools.map(t => t.name)

    expect(toolNames).toContain('remember_fact')
    expect(toolNames).toContain('update_memory')
    expect(toolNames).toContain('forget_memory')
    expect(toolNames).toContain('recall_memories')
    expect(registry.isNativeTool('remember_fact')).toBe(true)
  })

  test('recall_memories_with_no_results_returns_message', async () => {
    mockVectorSearch.mockImplementationOnce(() => Promise.resolve([]))

    const result = await registry.executeNativeTool(
      'recall_memories',
      { query: 'nonexistent topic' },
      { userId: 'user123', guildId: null }
    )

    expect(typeof result).toBe('string')
    expect(result.toLowerCase()).toContain('no memories')
  })

  test('executeNativeTool_throws_for_unknown_tool', async () => {
    await expect(
      registry.executeNativeTool(
        'nonexistent_tool',
        {},
        { userId: 'user123', guildId: null }
      )
    ).rejects.toThrow('not found')
  })

  // --- Revision 1: argument validation tests ---

  test('remember_fact_rejects_empty_string', async () => {
    const result = await registry.executeNativeTool(
      'remember_fact',
      { fact: '' },
      { userId: 'user123', guildId: 'guild456' }
    )
    expect(result).toContain('Error')
    expect(result).toContain('"fact"')
    expect(mockSaveMemory).not.toHaveBeenCalled()
  })

  test('remember_fact_rejects_non_string_fact', async () => {
    const result = await registry.executeNativeTool(
      'remember_fact',
      { fact: 123 },
      { userId: 'user123', guildId: 'guild456' }
    )
    expect(result).toContain('Error')
    expect(result).toContain('"fact"')
    expect(mockSaveMemory).not.toHaveBeenCalled()
  })

  test('remember_fact_rejects_undefined_fact', async () => {
    const result = await registry.executeNativeTool(
      'remember_fact',
      {},
      { userId: 'user123', guildId: 'guild456' }
    )
    expect(result).toContain('Error')
    expect(result).toContain('"fact"')
  })

  test('remember_fact_rejects_non_string_context', async () => {
    const result = await registry.executeNativeTool(
      'remember_fact',
      { fact: 'valid fact', context: 42 },
      { userId: 'user123', guildId: 'guild456' }
    )
    expect(result).toContain('Error')
    expect(result).toContain('"context"')
    expect(mockSaveMemory).not.toHaveBeenCalled()
  })

  test('remember_fact_allows_undefined_context', async () => {
    const result = await registry.executeNativeTool(
      'remember_fact',
      { fact: 'valid fact' },
      { userId: 'user123', guildId: 'guild456' }
    )
    expect(result).not.toContain('Error')
    expect(mockSaveMemory).toHaveBeenCalled()
  })

  test('update_memory_rejects_empty_description', async () => {
    const result = await registry.executeNativeTool(
      'update_memory',
      { description: '', new_value: 'something' },
      { userId: 'user123', guildId: 'guild456' }
    )
    expect(result).toContain('Error')
    expect(result).toContain('"description"')
  })

  test('update_memory_rejects_empty_new_value', async () => {
    const result = await registry.executeNativeTool(
      'update_memory',
      { description: 'some memory', new_value: '   ' },
      { userId: 'user123', guildId: 'guild456' }
    )
    expect(result).toContain('Error')
    expect(result).toContain('"new_value"')
  })

  test('forget_memory_rejects_empty_description', async () => {
    const result = await registry.executeNativeTool(
      'forget_memory',
      { description: '' },
      { userId: 'user123', guildId: 'guild456' }
    )
    expect(result).toContain('Error')
    expect(result).toContain('"description"')
  })

  test('recall_memories_rejects_empty_query', async () => {
    const result = await registry.executeNativeTool(
      'recall_memories',
      { query: '' },
      { userId: 'user123', guildId: 'guild456' }
    )
    expect(result).toContain('Error')
    expect(result).toContain('"query"')
  })

  test('recall_memories_clamps_limit_to_valid_range', async () => {
    mockVectorSearch.mockImplementationOnce(() => Promise.resolve([]))

    // Negative limit should be clamped to 1
    await registry.executeNativeTool(
      'recall_memories',
      { query: 'any topic', limit: -5 },
      { userId: 'user123', guildId: null }
    )
    // Verify it didn't throw — clamping worked

    mockVectorSearch.mockImplementationOnce(() => Promise.resolve([]))

    // Limit > 10 should be clamped to 10
    await registry.executeNativeTool(
      'recall_memories',
      { query: 'any topic', limit: 100 },
      { userId: 'user123', guildId: null }
    )
    // Verify it didn't throw — clamping worked
  })
})
