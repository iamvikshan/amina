import { describe, test, expect, mock, beforeEach } from 'bun:test'

const logCalls: string[] = []
const noop = () => {}

// Top-level mock with configurable getJson behavior per test
let getJsonImpl: (url: string) => Promise<any> = async () => ({ success: false })

mock.module('@helpers/Logger', () => ({
  default: { success: noop, log: noop, warn: noop, error: noop, debug: noop },
  success: (msg: string) => logCalls.push(`success: ${msg}`),
  warn: (msg: string) => logCalls.push(`warn: ${msg}`),
  error: (msg: string) => logCalls.push(`error: ${msg}`),
  log: noop,
  debug: noop,
}))

mock.module('@root/package.json', () => ({
  default: { version: '3.2.4' },
}))

mock.module('@helpers/HttpUtils', () => ({
  default: {
    getJson: async (url: string) => getJsonImpl(url),
  },
}))

const { default: BotUtils } = await import('../src/helpers/BotUtils')

describe('BotUtils.checkForUpdates', () => {
  beforeEach(() => {
    logCalls.length = 0
  })

  test('uses npm registry when GitHub fetch fails', async () => {
    getJsonImpl = async (url: string) => {
      if (url.includes('github.com')) return { success: false }
      if (url.includes('npmjs.org'))
        return { success: true, data: { version: '3.2.5' } }
      return { success: false }
    }

    await BotUtils.checkForUpdates()

    expect(logCalls.some((m) => m.includes('error'))).toBe(false)
    expect(logCalls.some((m) => m.includes('v3.2.5 update is available'))).toBe(
      true
    )
    expect(logCalls.some((m) => m.includes('bunx amina update'))).toBe(true)
  })

  test('returns gracefully when both GitHub and npm fail', async () => {
    getJsonImpl = async () => ({ success: false })

    await BotUtils.checkForUpdates()

    expect(
      logCalls.some((m) => m.includes('GitHub and npm both failed'))
    ).toBe(true)
  })

  test('does not log update or error when already up to date (GitHub succeeds)', async () => {
    getJsonImpl = async () => ({
      success: true,
      data: { tag_name: 'v3.2.4' },
    })

    await BotUtils.checkForUpdates()

    expect(logCalls.some((m) => m.includes('update is available'))).toBe(false)
    expect(logCalls.some((m) => m.includes('failed'))).toBe(false)
  })
})
