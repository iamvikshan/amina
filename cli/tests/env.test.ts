import { describe, expect, test } from 'bun:test'

import { validateEnv, envImportMode, configureEnv } from '../src/env'
import type { PromptsFn } from '../src/shared'

function mockPrompts(responses: Record<string, unknown> = {}): PromptsFn {
  return {
    text: async () => (responses.text as string) ?? '',
    password: async () => (responses.password as string) ?? '',
    select: async <T>() => (responses.select as T | symbol) ?? ('' as unknown as T),
    confirm: async () => (responses.confirm as boolean) ?? true,
    spinner: () => ({ start: () => {}, stop: () => {}, message: () => {} }),
    intro: () => {},
    outro: () => {},
    cancel: () => {},
    isCancel: (_value: unknown): _value is symbol => false,
    log: { info: () => {}, warn: () => {}, error: () => {}, success: () => {}, step: () => {}, message: () => {} },
  }
}

describe('validateEnv', () => {
  test('rejects when BOT_TOKEN missing', () => {
    const result = validateEnv('MONGO_CONNECTION=mongodb://localhost')
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('BOT_TOKEN'))).toBe(true)
  })

  test('rejects when MONGO_CONNECTION missing', () => {
    const result = validateEnv('BOT_TOKEN=abc123')
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('MONGO_CONNECTION'))).toBe(true)
  })

  test('passes with only required vars', () => {
    const result = validateEnv('BOT_TOKEN=abc123\nMONGO_CONNECTION=mongodb://localhost')
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('reports missing optional vars as warnings', () => {
    const result = validateEnv('BOT_TOKEN=abc123\nMONGO_CONNECTION=mongodb://localhost')
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  test('rejects quoted empty required values', () => {
    const result = validateEnv('BOT_TOKEN=""\nMONGO_CONNECTION=real')
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => e.includes('BOT_TOKEN'))).toBe(true)
  })

  test('accepts quoted non-empty required values', () => {
    const result = validateEnv('BOT_TOKEN="abc123"\nMONGO_CONNECTION="mongodb://localhost"')
    expect(result.ok).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

describe('envImportMode', () => {
  test('returns file contents when file exists', async () => {
    const prompts = mockPrompts({ text: '/tmp/test.env' })
    const deps = {
      fileExists: () => true,
      readFile: () => 'BOT_TOKEN=abc\nMONGO_CONNECTION=xyz',
    }

    const content = await envImportMode(prompts, deps)
    expect(content).toBe('BOT_TOKEN=abc\nMONGO_CONNECTION=xyz')
  })

  test('throws when file not found', async () => {
    const prompts = mockPrompts({ text: '/tmp/missing.env' })
    const deps = {
      fileExists: () => false,
      readFile: () => '',
    }

    await expect(envImportMode(prompts, deps)).rejects.toThrow()
  })
})

describe('configureEnv', () => {
  test('routes guided mode', async () => {
    const prompts = mockPrompts({ text: 'test-value', password: 'secret', confirm: true })
    const content = await configureEnv(prompts, 'guided')
    expect(content).toContain('BOT_TOKEN=')
    expect(content).toContain('MONGO_CONNECTION=')
  })
})
