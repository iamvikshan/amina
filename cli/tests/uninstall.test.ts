import { describe, expect, test } from 'bun:test'

import type { PromptsFn } from '../src/shared'
import { runUninstall } from '../src/uninstall'

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

describe('uninstall', () => {
  test('confirms before removing', async () => {
    let confirmCalled = false

    const code = await runUninstall({
      deployPath: '/deploy/amina',
      fileExists: (p) => p.endsWith('docker-compose.yml'),
      spawnFn: () => ({ success: true, stdout: '', stderr: '' }),
      rmdir: () => {},
      prompts: mockPrompts({
        confirm: async () => { confirmCalled = true; return true },
      }),
    })

    expect(code).toBe(0)
    expect(confirmCalled).toBe(true)
  })

  test('force skips confirmation', async () => {
    let confirmCalled = false

    const code = await runUninstall({
      deployPath: '/deploy/amina',
      fileExists: (p) => p.endsWith('docker-compose.yml'),
      spawnFn: () => ({ success: true, stdout: '', stderr: '' }),
      rmdir: () => {},
      force: true,
      prompts: mockPrompts({
        confirm: async () => { confirmCalled = true; return true },
      }),
    })

    expect(code).toBe(0)
    expect(confirmCalled).toBe(false)
  })

  test('dry-run logs without removing', async () => {
    const spawnCalls: string[][] = []
    let rmdirCalled = false

    const code = await runUninstall({
      deployPath: '/deploy/amina',
      fileExists: (p) => p.endsWith('docker-compose.yml'),
      spawnFn: (args) => { spawnCalls.push(args); return { success: true, stdout: '', stderr: '' } },
      rmdir: () => { rmdirCalled = true },
      dryRun: true,
      prompts: mockPrompts(),
    })

    expect(code).toBe(0)
    expect(rmdirCalled).toBe(false)
    const mutations = spawnCalls.filter(a => a.includes('down'))
    expect(mutations).toHaveLength(0)
  })

  test('errors when no deployment found', async () => {
    const code = await runUninstall({
      deployPath: '/nonexistent',
      fileExists: () => false,
      prompts: mockPrompts(),
    })

    expect(code).toBe(1)
  })
})
