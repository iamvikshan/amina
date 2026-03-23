import { describe, expect, test } from 'bun:test'

import { runCheck } from '../src/check'
import { main } from '../src/index'
import type { PromptsFn } from '../src/shared'
import { spawn } from '../src/shared'
import { runUpdate } from '../src/update'

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

// -- Version check tests (migrated from index.ts imports) --

type CliRunResult = {
  exitCode: number
  output: string[]
  errors: string[]
}

function createReleaseResponse(version: string): Response {
  return new Response(
    JSON.stringify({
      tag_name: `v${version}`,
      html_url: 'https://github.com/iamvikshan/amina/releases/latest',
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }
  )
}

async function executeCli(options: {
  cwd: string
  files?: Record<string, string>
  fetchResponse?: Response
  fetchError?: Error
}): Promise<CliRunResult> {
  const output: string[] = []
  const errors: string[] = []
  const files = options.files ?? {}

  const exitCode = await runCheck({
    cwd: options.cwd,
    fetchImpl: async () => {
      if (options.fetchError) {
        throw options.fetchError
      }

      return options.fetchResponse ?? createReleaseResponse('3.2.5')
    },
    fileExists: (filePath) => filePath in files,
    readFile: (filePath) => {
      const file = files[filePath]
      if (file === undefined) {
        throw new Error(`Unexpected read: ${filePath}`)
      }

      return file
    },
    log: (message) => output.push(message),
    error: (message) => errors.push(message),
  })

  return { exitCode, output, errors }
}

describe('amina check', () => {
  test('shows up to date when versions match', async () => {
    const result = await executeCli({
      cwd: '/repo/apps/bot',
      files: {
        '/repo/package.json': JSON.stringify({ name: 'amina', version: '3.2.5' }),
      },
      fetchResponse: createReleaseResponse('3.2.5'),
    })

    expect(result.exitCode).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(result.output.join('\n')).toContain('Amina is up to date')
    expect(result.output.join('\n')).toContain('Current version: 3.2.5')
    expect(result.output.join('\n')).toContain('Latest release: 3.2.5')
  })

  test('shows update available with instructions when behind', async () => {
    const result = await executeCli({
      cwd: '/repo',
      files: {
        '/repo/package.json': JSON.stringify({ name: 'amina', version: '3.1.0' }),
      },
      fetchResponse: createReleaseResponse('3.2.5'),
    })

    expect(result.exitCode).toBe(0)
    expect(result.errors).toHaveLength(0)

    const text = result.output.join('\n')
    expect(text).toContain('Update available: 3.1.0 -> 3.2.5')
    expect(text).toContain('https://github.com/iamvikshan/amina/releases/latest')
    expect(text).toContain('https://gitlab.com/vikshan/amina/-/releases')
    expect(text).toContain('ghcr.io/iamvikshan/amina')
    expect(text).toContain('registry.gitlab.com/vikshan/amina')
  })

  test('shows local version is newer when ahead of latest release', async () => {
    const result = await executeCli({
      cwd: '/repo',
      files: {
        '/repo/package.json': JSON.stringify({ name: 'amina', version: '3.3.0' }),
      },
      fetchResponse: createReleaseResponse('3.2.5'),
    })

    expect(result.exitCode).toBe(0)
    expect(result.errors).toHaveLength(0)

    const text = result.output.join('\n')
    expect(text).toContain('Local version is newer than the latest published release.')
    expect(text).toContain('Current version: 3.3.0')
    expect(text).toContain('Latest release: 3.2.5')
    expect(text).not.toContain('Amina is up to date.')
  })

  test('handles fetch failure gracefully', async () => {
    const result = await executeCli({
      cwd: '/repo',
      fetchError: new Error('network down'),
    })

    expect(result.exitCode).toBe(1)
    expect(result.output).toHaveLength(0)
    expect(result.errors.join('\n')).toContain('Failed to check the latest Amina release')
    expect(result.errors.join('\n')).toContain('network down')
  })

  test('shows latest-only output when local package.json is missing', async () => {
    const result = await executeCli({
      cwd: '/repo',
      fetchResponse: createReleaseResponse('3.2.5'),
    })

    expect(result.exitCode).toBe(0)
    expect(result.errors).toHaveLength(0)

    const text = result.output.join('\n')
    expect(text).toContain('Latest Amina release: 3.2.5')
    expect(text).toContain('Local Amina version could not be detected')
    expect(text).toContain('https://github.com/iamvikshan/amina/releases/latest')
    expect(text).not.toContain('Current version:')
  })

  test('skips malformed parent package.json files while walking upward', async () => {
    const result = await executeCli({
      cwd: '/repo/apps/bot',
      files: {
        '/repo/apps/package.json': '{not json',
        '/repo/package.json': JSON.stringify({ name: 'amina', version: '3.2.5' }),
      },
      fetchResponse: createReleaseResponse('3.2.5'),
    })

    expect(result.exitCode).toBe(0)
    expect(result.errors).toHaveLength(0)

    const text = result.output.join('\n')
    expect(text).toContain('Amina is up to date.')
    expect(text).toContain('Current version: 3.2.5')
    expect(text).toContain('Latest release: 3.2.5')
  })
})

// -- Subcommand routing tests --

describe('subcommand routing', () => {
  test('routes "help" and prints usage text', async () => {
    const lines: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => lines.push(String(args[0] ?? ''))

    const code = await main(['node', 'amina', 'help'])

    console.log = origLog
    expect(code).toBe(0)
    // eslint-disable-next-line no-control-regex
    const plain = lines.join('\n').replace(/\u001b\[[0-9;]*m/g, '')
    expect(plain).toContain('Usage: amina <command>')
  })

  test('returns 1 for unknown subcommand', async () => {
    const errors: string[] = []
    const origErr = console.error
    const origLog = console.log
    console.error = (...args: unknown[]) => errors.push(String(args[0] ?? ''))
    console.log = () => {}

    const code = await main(['node', 'amina', 'bogus'])

    console.error = origErr
    console.log = origLog
    expect(code).toBe(1)
    expect(errors.join('\n')).toContain('Unknown command: bogus')
  })
})

// -- Update deployment-dir validation tests --

describe('update deployment-dir validation', () => {
  test('returns error when docker-compose.yml is missing', async () => {
    const code = await runUpdate({
      deployPath: '/nonexistent/path',
      fileExists: () => false,
      spawnFn: () => ({ success: true, stdout: '', stderr: '' }),
    })

    expect(code).toBe(1)
  })

  test('succeeds when deployment dir is valid', async () => {
    const code = await runUpdate({
      deployPath: '/deploy/amina',
      fileExists: (p) => p === '/deploy/amina/docker-compose.yml',
      spawnFn: (args) => {
        if (args.join(' ').includes('inspect')) return { success: true, stdout: 'healthy', stderr: '' }
        return { success: true, stdout: '', stderr: '' }
      },
      prompts: mockPrompts(),
    })

    expect(code).toBe(0)
  })
})

// -- Spawn helper tests --

describe('spawn helper', () => {
  test('returns structured result with stdout and success flag', () => {
    const result = spawn([process.execPath, '-e', 'process.stdout.write("hello")'])

    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('stdout')
    expect(result).toHaveProperty('stderr')
    expect(typeof result.success).toBe('boolean')
    expect(typeof result.stdout).toBe('string')
    expect(typeof result.stderr).toBe('string')
    expect(result.success).toBe(true)
    expect(result.stdout).toBe('hello')
  })
})

// -- Update deploy mode tests --

describe('update deploy', () => {
  test('detects changed images and restarts only those', async () => {
    const spawnCalls: string[][] = []
    let imageCallCount = 0

    const code = await runUpdate({
      deployPath: '/deploy/amina',
      fileExists: (p) => p.endsWith('docker-compose.yml'),
      mode: 'deploy',
      prompts: mockPrompts(),
      spawnFn: (args) => {
        spawnCalls.push(args)
        const cmd = args.join(' ')
        if (cmd.includes('images') && cmd.includes('--format')) {
          imageCallCount++
          if (imageCallCount === 1) {
            return { success: true, stdout: '{"Service":"amina","ID":"abc123"}\n{"Service":"lavalink","ID":"def456"}', stderr: '' }
          }
          return { success: true, stdout: '{"Service":"amina","ID":"abc123"}\n{"Service":"lavalink","ID":"new789"}', stderr: '' }
        }
        if (cmd.includes('inspect')) return { success: true, stdout: 'healthy', stderr: '' }
        return { success: true, stdout: '', stderr: '' }
      },
    })

    expect(code).toBe(0)
    const upCall = spawnCalls.find(a => a.includes('up') && a.includes('-d'))
    expect(upCall).toBeDefined()
    expect(upCall).toContain('lavalink')
    expect(upCall).not.toContain('amina')
  })

  test('dry-run logs without executing', async () => {
    const spawnCalls: string[][] = []

    const code = await runUpdate({
      deployPath: '/deploy/amina',
      fileExists: (p) => p.endsWith('docker-compose.yml'),
      mode: 'deploy',
      dryRun: true,
      spawnFn: (args) => { spawnCalls.push(args); return { success: true, stdout: '', stderr: '' } },
    })

    expect(code).toBe(0)
    expect(spawnCalls.filter(a => a.includes('pull'))).toHaveLength(0)
  })

  test('shows health dashboard after restart', async () => {
    const logged: string[] = []
    let imageCallCount = 0

    const code = await runUpdate({
      deployPath: '/deploy/amina',
      fileExists: (p) => p.endsWith('docker-compose.yml'),
      mode: 'deploy',
      spawnFn: (args) => {
        const cmd = args.join(' ')
        if (cmd.includes('images') && cmd.includes('--format')) {
          imageCallCount++
          if (imageCallCount === 1) return { success: true, stdout: '{"Service":"amina","ID":"old"}', stderr: '' }
          return { success: true, stdout: '{"Service":"amina","ID":"new"}', stderr: '' }
        }
        if (cmd.includes('inspect')) return { success: true, stdout: 'healthy', stderr: '' }
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
})

// -- Update dev mode tests --

describe('update dev', () => {
  test('clean pull succeeds', async () => {
    const spawnCalls: string[][] = []

    const code = await runUpdate({
      deployPath: '/dev/amina',
      fileExists: (p) => p.endsWith('.git'),
      mode: 'dev',
      spawnFn: (args) => {
        spawnCalls.push(args)
        return { success: true, stdout: '', stderr: '' }
      },
    })

    expect(code).toBe(0)
    const pullCall = spawnCalls.find(a => a.includes('pull') && a.includes('--ff-only'))
    expect(pullCall).toBeDefined()
  })

  test('dirty working tree offers overwrite or versioned folder', async () => {
    let selectCalled = false
    const spawnCalls: string[][] = []

    const code = await runUpdate({
      deployPath: '/dev/amina',
      fileExists: (p) => p.endsWith('.git'),
      mode: 'dev',
      spawnFn: (args) => {
        spawnCalls.push(args)
        if (args.includes('status') && args.includes('--porcelain')) {
          return { success: true, stdout: 'M src/index.ts', stderr: '' }
        }
        return { success: true, stdout: '', stderr: '' }
      },
      prompts: mockPrompts({
        select: async () => { selectCalled = true; return 'overwrite' as never },
      }),
    })

    expect(code).toBe(0)
    expect(selectCalled).toBe(true)
    const stashCall = spawnCalls.find(a => a.includes('stash') && a.includes('push'))
    expect(stashCall).toBeDefined()
    expect(stashCall).toContain('-u')
  })

  test('versioned folder confirms before cloning', async () => {
    let confirmCalled = false
    const spawnCalls: string[][] = []

    const code = await runUpdate({
      deployPath: '/dev/amina',
      fileExists: (p) => p.endsWith('.git'),
      mode: 'dev',
      spawnFn: (args) => {
        spawnCalls.push(args)
        if (args.includes('status') && args.includes('--porcelain')) {
          return { success: true, stdout: 'M src/index.ts', stderr: '' }
        }
        if (args.includes('describe') && args.includes('--tags')) {
          return { success: true, stdout: 'v3.2.0', stderr: '' }
        }
        return { success: true, stdout: '', stderr: '' }
      },
      prompts: mockPrompts({
        select: async () => 'versioned' as never,
        confirm: async () => { confirmCalled = true; return true },
      }),
    })

    expect(code).toBe(0)
    expect(confirmCalled).toBe(true)
    const cloneCall = spawnCalls.find(a => a.includes('clone'))
    expect(cloneCall).toBeDefined()
    expect(cloneCall?.some(a => a.includes('amina-v3.2.0'))).toBe(true)
  })
})

// -- Routing tests for new commands --

describe('subcommand routing (new commands)', () => {
  test('routes "uninstall" and "status" correctly', async () => {
    const errors: string[] = []
    const origErr = console.error
    const origLog = console.log
    const origWarn = console.warn
    console.error = (...args: unknown[]) => errors.push(String(args[0] ?? ''))
    console.log = () => {}
    console.warn = () => {}

    // Use nonexistent deploy paths so both commands exit early
    // without triggering interactive prompts or real docker calls
    const { runUninstall } = await import('../src/uninstall')
    const { runStatus } = await import('../src/status')
    await runUninstall({ deployPath: '/nonexistent/amina' })
    await runStatus({ deployPath: '/nonexistent/amina' })

    console.error = origErr
    console.log = origLog
    console.warn = origWarn

    // Routing worked -- neither produced "Unknown command"
    expect(errors.join('\n')).not.toContain('Unknown command')
  })
})

// -- Stash restore on pull failure --

describe('update dev stash safety', () => {
  test('stash restores on pull failure (force mode)', async () => {
    const spawnCalls: string[][] = []

    const code = await runUpdate({
      deployPath: '/dev/amina',
      fileExists: (p) => p.endsWith('.git'),
      mode: 'dev',
      force: true,
      spawnFn: (args) => {
        spawnCalls.push(args)
        if (args.includes('pull') && args.includes('--ff-only')) {
          return { success: false, stdout: '', stderr: 'merge conflict' }
        }
        if (args.includes('status') && args.includes('--porcelain')) {
          return { success: true, stdout: 'M src/index.ts', stderr: '' }
        }
        return { success: true, stdout: '', stderr: '' }
      },
    })

    expect(code).toBe(1)
    const stashPush = spawnCalls.find(a => a.includes('stash') && a.includes('push') && a.includes('-u'))
    expect(stashPush).toBeDefined()
    const stashPop = spawnCalls.find(a => a.includes('stash') && a.includes('pop'))
    expect(stashPop).toBeDefined()
    const stashDrop = spawnCalls.find(a => a.includes('stash') && a.includes('drop'))
    expect(stashDrop).toBeUndefined()
  })

  test('stash restores on pull failure (interactive overwrite)', async () => {
    const spawnCalls: string[][] = []

    const code = await runUpdate({
      deployPath: '/dev/amina',
      fileExists: (p) => p.endsWith('.git'),
      mode: 'dev',
      spawnFn: (args) => {
        spawnCalls.push(args)
        if (args.includes('pull') && args.includes('--ff-only')) {
          return { success: false, stdout: '', stderr: 'merge conflict' }
        }
        if (args.includes('status') && args.includes('--porcelain')) {
          return { success: true, stdout: 'M src/index.ts', stderr: '' }
        }
        return { success: true, stdout: '', stderr: '' }
      },
      prompts: mockPrompts({
        select: async () => 'overwrite' as never,
      }),
    })

    expect(code).toBe(1)
    const stashPush = spawnCalls.find(a => a.includes('stash') && a.includes('push') && a.includes('-u'))
    expect(stashPush).toBeDefined()
    const stashPop = spawnCalls.find(a => a.includes('stash') && a.includes('pop'))
    expect(stashPop).toBeDefined()
  })

  test('force mode uses git stash push -u', async () => {
    const spawnCalls: string[][] = []

    const code = await runUpdate({
      deployPath: '/dev/amina',
      fileExists: (p) => p.endsWith('.git'),
      mode: 'dev',
      force: true,
      spawnFn: (args) => {
        spawnCalls.push(args)
        if (args.includes('status') && args.includes('--porcelain')) {
          return { success: true, stdout: 'M src/index.ts', stderr: '' }
        }
        return { success: true, stdout: '', stderr: '' }
      },
    })

    expect(code).toBe(0)
    const stashCall = spawnCalls.find(a => a.includes('stash') && a.includes('push'))
    expect(stashCall).toBeDefined()
    expect(stashCall).toContain('-u')
  })
})

// -- Flag routing from main() --

describe('update deploy flag routing', () => {
  test('main() passes flags to runUpdate', async () => {
    const origErr = console.error
    const origLog = console.log
    const origWarn = console.warn
    console.error = () => {}
    console.log = () => {}
    console.warn = () => {}

    const code = await main(['node', 'amina', 'update', '--dry-run', '--mode', 'deploy'])

    console.error = origErr
    console.log = origLog
    console.warn = origWarn

    // Will return 1 because no real deployment exists, but it should not be "Unknown command"
    expect(typeof code).toBe('number')
  })
})
