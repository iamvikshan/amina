import { describe, expect, test } from 'bun:test'

import type { PromptsFn } from '../src/shared'
import { runStatus } from '../src/status'

function mockPrompts(overrides: Partial<PromptsFn> = {}): PromptsFn {
  return {
    text: async () => '',
    password: async () => '',
    select: async () => '' as never,
    confirm: async () => true,
    spinner: () => ({ start: () => {}, stop: () => {}, message: () => {} }),
    intro: () => {},
    outro: () => {},
    cancel: () => {},
    isCancel: (_v: unknown): _v is symbol => false,
    log: { info: () => {}, warn: () => {}, error: () => {}, success: () => {}, step: () => {}, message: () => {} },
    ...overrides,
  }
}

describe('status', () => {
  test('shows healthy dashboard', async () => {
    const logged: string[] = []

    const code = await runStatus({
      deployPath: '/deploy/amina',
      fileExists: (p) => p.endsWith('docker-compose.yml'),
      spawnFn: (args) => {
        if (args.includes('inspect')) {
          return { success: true, stdout: 'healthy', stderr: '' }
        }
        return { success: true, stdout: '', stderr: '' }
      },
      prompts: mockPrompts({
        log: {
          info: () => {},
          warn: () => {},
          error: () => {},
          success: (m: string) => logged.push(m),
          step: () => {},
          message: () => {},
        },
      }),
    })

    expect(code).toBe(0)
    expect(logged.some(l => l.includes('amina'))).toBe(true)
  })

  test('reports when deployment not found', async () => {
    const code = await runStatus({
      deployPath: '/nonexistent',
      fileExists: () => false,
    })

    expect(code).toBe(1)
  })
})
