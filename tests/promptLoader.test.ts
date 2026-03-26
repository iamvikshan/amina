import { describe, test, expect, beforeEach, mock } from 'bun:test'

const mockReadFileSync = mock(() => '# test prompt\nyou are mina.')
const mockLoggerWarn = mock(() => {})

void mock.module('fs', () => ({
  readFileSync: mockReadFileSync,
}))

void mock.module('../src/helpers/Logger', () => ({
  default: { warn: mockLoggerWarn },
}))

const { loadPrompt, _resetCache, FALLBACK_PROMPT } = await import(
  '../src/helpers/promptLoader'
)

describe('promptLoader', () => {
  beforeEach(() => {
    _resetCache()
    mockReadFileSync.mockReset()
    mockLoggerWarn.mockReset()
    mockReadFileSync.mockReturnValue('# test prompt\nyou are mina.')
  })

  test('loads prompt.md and returns string content', () => {
    const result = loadPrompt()
    expect(result).toBe('# test prompt\nyou are mina.')
    expect(mockReadFileSync).toHaveBeenCalledTimes(1)
  })

  test('caches prompt on subsequent calls', () => {
    loadPrompt()
    loadPrompt()
    expect(mockReadFileSync).toHaveBeenCalledTimes(1)
  })

  test('_resetCache clears cached value', () => {
    loadPrompt()
    _resetCache()
    loadPrompt()
    expect(mockReadFileSync).toHaveBeenCalledTimes(2)
  })

  test('returns fallback when prompt.md is missing', () => {
    mockReadFileSync.mockImplementation(() => {
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    })
    const result = loadPrompt()
    expect(result).toBe(FALLBACK_PROMPT)
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1)
  })

  test('returns fallback when prompt.md is empty', () => {
    mockReadFileSync.mockReturnValue('')
    const result = loadPrompt()
    expect(result).toBe(FALLBACK_PROMPT)
  })

  test('returns fallback when prompt.md is whitespace only', () => {
    mockReadFileSync.mockReturnValue('   \n  \t  ')
    const result = loadPrompt()
    expect(result).toBe(FALLBACK_PROMPT)
  })

  test('does not cache fallback -- retries file on next call', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT')
    })
    expect(loadPrompt()).toBe(FALLBACK_PROMPT)

    mockReadFileSync.mockReturnValue('recovered prompt')
    expect(loadPrompt()).toBe('recovered prompt')
    expect(mockReadFileSync).toHaveBeenCalledTimes(2)
  })
})
