import { describe, test, expect, mock, beforeEach } from 'bun:test'

const logCalls: string[] = []
const requestedUrls: string[] = []
const noop = () => {}

let getJsonImpl: (url: string) => Promise<any> = async () => ({
  success: false,
})

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
    getJson: async (url: string) => {
      requestedUrls.push(url)
      return getJsonImpl(url)
    },
  },
}))

const { default: BotUtils } = await import('../src/helpers/BotUtils')

describe('BotUtils.checkForUpdates', () => {
  beforeEach(() => {
    logCalls.length = 0
    requestedUrls.length = 0
  })

  test('returns gracefully when GitHub fails', async () => {
    getJsonImpl = async () => ({ success: false })

    await BotUtils.checkForUpdates()

    expect(
      logCalls.some(m => m.includes('Failed to check for bot updates'))
    ).toBe(true)
    expect(requestedUrls).toHaveLength(1)
    expect(requestedUrls[0]).toContain('api.github.com')
    expect(requestedUrls.some(u => u.includes('npmjs'))).toBe(false)
  })

  test('does not log update or error when already up to date (GitHub succeeds)', async () => {
    getJsonImpl = async () => ({
      success: true,
      data: { tag_name: 'v3.2.4' },
    })

    await BotUtils.checkForUpdates()

    expect(logCalls.some(m => m.includes('update is available'))).toBe(false)
    expect(logCalls.some(m => m.includes('failed'))).toBe(false)
  })
})
