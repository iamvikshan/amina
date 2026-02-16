import { describe, test, expect, mock, beforeEach } from 'bun:test'

// Mock Logger to avoid side effects
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

import { AiMetricsService, type AiMetricsDeps } from '../src/services/aiMetrics'

describe('AiMetricsService', () => {
  let service: AiMetricsService
  let mockUserUpdateOne: ReturnType<typeof mock>
  let mockGuildUpdateOne: ReturnType<typeof mock>
  let mockIncrementAiStats: ReturnType<typeof mock>

  beforeEach(() => {
    mockUserUpdateOne = mock(() => Promise.resolve())
    mockGuildUpdateOne = mock(() => Promise.resolve())
    mockIncrementAiStats = mock(() => Promise.resolve())

    const deps: AiMetricsDeps = {
      userModel: { updateOne: mockUserUpdateOne },
      guildModel: { updateOne: mockGuildUpdateOne },
      incrementAiStats: mockIncrementAiStats as any,
    }

    service = new AiMetricsService(deps)
  })

  test('record increments user buffer', () => {
    service.record({
      userId: 'user1',
      guildId: 'guild1',
      tokensUsed: 100,
      toolCalls: 2,
      memoriesCreated: 1,
    })

    expect(service.pendingUserCount).toBe(1)

    // Record again for the same user
    service.record({
      userId: 'user1',
      guildId: 'guild1',
      tokensUsed: 50,
      toolCalls: 1,
      memoriesCreated: 0,
    })

    // Still only 1 user in buffer, but values should be accumulated
    expect(service.pendingUserCount).toBe(1)
  })

  test('record increments guild buffer', () => {
    service.record({
      userId: 'user1',
      guildId: 'guild1',
      tokensUsed: 100,
      toolCalls: 1,
      memoriesCreated: 0,
    })

    expect(service.pendingGuildCount).toBe(1)

    service.record({
      userId: 'user2',
      guildId: 'guild2',
      tokensUsed: 200,
      toolCalls: 0,
      memoriesCreated: 1,
    })

    expect(service.pendingGuildCount).toBe(2)
  })

  test('record skips guild for DMs', () => {
    service.record({
      userId: 'user1',
      guildId: null,
      tokensUsed: 50,
      toolCalls: 0,
      memoriesCreated: 0,
    })

    expect(service.pendingGuildCount).toBe(0)
    expect(service.pendingUserCount).toBe(1)
  })

  test('record increments global buffer', () => {
    service.record({
      userId: 'user1',
      guildId: null,
      tokensUsed: 100,
      toolCalls: 0,
      memoriesCreated: 0,
    })

    expect(service.pendingGlobalMessages).toBe(1)

    service.record({
      userId: 'user2',
      guildId: 'guild1',
      tokensUsed: 200,
      toolCalls: 1,
      memoriesCreated: 0,
    })

    expect(service.pendingGlobalMessages).toBe(2)
  })

  test('flush calls updateOne for users and guilds', async () => {
    service.record({
      userId: 'user1',
      guildId: 'guild1',
      tokensUsed: 100,
      toolCalls: 2,
      memoriesCreated: 1,
    })

    service.record({
      userId: 'user2',
      guildId: 'guild2',
      tokensUsed: 50,
      toolCalls: 0,
      memoriesCreated: 0,
    })

    await service.flush()

    expect(mockUserUpdateOne).toHaveBeenCalledTimes(2)
    expect(mockGuildUpdateOne).toHaveBeenCalledTimes(2)
    expect(mockIncrementAiStats).toHaveBeenCalledTimes(1)
  })

  test('flush clears buffers after success', async () => {
    service.record({
      userId: 'user1',
      guildId: 'guild1',
      tokensUsed: 100,
      toolCalls: 1,
      memoriesCreated: 0,
    })

    expect(service.pendingUserCount).toBe(1)
    expect(service.pendingGuildCount).toBe(1)
    expect(service.pendingGlobalMessages).toBe(1)

    await service.flush()

    expect(service.pendingUserCount).toBe(0)
    expect(service.pendingGuildCount).toBe(0)
    expect(service.pendingGlobalMessages).toBe(0)
  })

  test('flush requeues on failure', async () => {
    service.record({
      userId: 'user1',
      guildId: 'guild1',
      tokensUsed: 100,
      toolCalls: 1,
      memoriesCreated: 0,
    })

    // Make all DB calls fail
    mockUserUpdateOne.mockImplementation(() =>
      Promise.reject(new Error('DB error'))
    )
    mockGuildUpdateOne.mockImplementation(() =>
      Promise.reject(new Error('DB error'))
    )
    mockIncrementAiStats.mockImplementation(() =>
      Promise.reject(new Error('DB error'))
    )

    await service.flush()

    // Data should be re-buffered
    expect(service.pendingUserCount).toBe(1)
    expect(service.pendingGuildCount).toBe(1)
    expect(service.pendingGlobalMessages).toBe(1)
  })

  test('flush noop when empty', async () => {
    // Flush with nothing recorded
    await service.flush()

    expect(mockUserUpdateOne).not.toHaveBeenCalled()
    expect(mockGuildUpdateOne).not.toHaveBeenCalled()
    expect(mockIncrementAiStats).not.toHaveBeenCalled()
  })
})
