import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test'

const successCalls: string[] = []
const errorCalls: Array<{ message: string; error: unknown }> = []
const noop = () => {}

void mock.module('@helpers/Logger', () => ({
  default: {
    success: (message: string) => successCalls.push(message),
    error: (message: string, error?: unknown) =>
      errorCalls.push({ message, error }),
    log: noop,
    warn: noop,
    debug: noop,
  },
  success: (message: string) => successCalls.push(message),
  error: (message: string, error?: unknown) =>
    errorCalls.push({ message, error }),
  log: noop,
  warn: noop,
  debug: noop,
}))

void mock.module('@src/config/config', () => ({
  default: {
    SERVER: {
      HEALTH_PORT: 4321,
    },
  },
}))

const originalServe = Bun.serve
const { startHealthServer, stopHealthServer } = await import(
  '../src/services/health'
)

describe('health service', () => {
  let stopMock: ReturnType<typeof mock>
  let serveMock: ReturnType<typeof mock>
  let mockServer: ReturnType<typeof Bun.serve>

  beforeEach(async () => {
    successCalls.length = 0
    errorCalls.length = 0

    await stopHealthServer()

    stopMock = mock(() => {})
    mockServer = { stop: stopMock } as unknown as ReturnType<typeof Bun.serve>
    serveMock = mock(() => mockServer)

    Bun.serve = serveMock as typeof Bun.serve
  })

  afterAll(async () => {
    await stopHealthServer()

    Bun.serve = originalServe
  })

  test('starts once, caches the server, and stops cleanly', async () => {
    const firstServer = await startHealthServer()
    const secondServer = await startHealthServer()

    expect(firstServer).toBe(mockServer)
    expect(secondServer).toBe(firstServer)
    expect(stopMock).not.toHaveBeenCalled()
    expect(serveMock).toHaveBeenCalledTimes(1)
    expect(serveMock.mock.calls[0]?.[0]).toMatchObject({ port: 4321 })

    const stopResult = await stopHealthServer()

    expect(stopResult).toEqual({ ok: true })
    expect(stopMock).toHaveBeenCalledTimes(1)
    expect(successCalls).toContain('Health server closed')

    const repeatedStopResult = await stopHealthServer()

    expect(repeatedStopResult).toEqual({ ok: true })
    expect(stopMock).toHaveBeenCalledTimes(1)

    await startHealthServer()

    expect(serveMock).toHaveBeenCalledTimes(2)
  })

  test('returns failure details when stop throws and clears the cached server', async () => {
    const stopError = new Error('stop failed')
    stopMock = mock(() => {
      throw stopError
    })
    mockServer = { stop: stopMock } as unknown as ReturnType<typeof Bun.serve>
    serveMock = mock(() => mockServer)

    Bun.serve = serveMock as typeof Bun.serve

    await startHealthServer()

    const stopResult = await stopHealthServer()

    expect(stopResult).toEqual({ ok: false, error: stopError })
    expect(errorCalls).toEqual([
      {
        message: 'Error during health server shutdown',
        error: stopError,
      },
    ])

    const repeatedStopResult = await stopHealthServer()

    expect(repeatedStopResult).toEqual({ ok: true })
    expect(stopMock).toHaveBeenCalledTimes(1)
  })
})
