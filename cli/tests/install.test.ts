import { describe, expect, test, beforeEach } from 'bun:test'
import type { PromptsFn, SpawnResult } from '../src/shared'
import { runInstall, ensurePrerequisites, checkExistingDeployment } from '../src/install'
import { parseFlags } from '../src/index'

// DI-based env mocks -- passed via deps.configureEnvFn / deps.validateEnvFn
let configureEnvQueue: string[] = []
const ENV_VALID = 'BOT_TOKEN=tok\nMONGO_CONNECTION=mongo://x\n'

function mockConfigureEnv() {
  return async () => {
    return configureEnvQueue.length > 0 ? configureEnvQueue.shift() ?? ENV_VALID : ENV_VALID
  }
}

function mockValidateEnv() {
  return (content: string) => {
    const map = new Map<string, string>()
    for (const line of content.split('\n')) {
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      const val = line.slice(eq + 1).trim()
      if (key && val) map.set(key, val)
    }
    const errors: string[] = []
    if (!map.get('BOT_TOKEN')) errors.push('Missing required variable: BOT_TOKEN')
    if (!map.get('MONGO_CONNECTION')) errors.push('Missing required variable: MONGO_CONNECTION')
    return { ok: errors.length === 0, errors, warnings: [] as string[] }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function defaultSpawn(args: string[]): SpawnResult {
  if (args.join(' ').includes('docker inspect')) return { success: true, stdout: 'healthy', stderr: '' }
  return { success: true, stdout: '', stderr: '' }
}

const noop = () => {}

beforeEach(() => {
  configureEnvQueue = []
})

// ---------------------------------------------------------------------------
// ensurePrerequisites (includes migrated update.test.ts prereq tests)
// ---------------------------------------------------------------------------

describe('install prerequisite detection', () => {
  test('reports missing docker when not found', async () => {
    const result = await ensurePrerequisites({
      commandExistsFn: (cmd: string) => cmd === 'git',
      spawnFn: () => ({ success: false, stdout: '', stderr: '' }),
      isDebian: () => false,
    })

    expect(result.ok).toBe(false)
    expect(result.missing).toContain('docker')
  })

  test('passes when all prerequisites are present', async () => {
    const result = await ensurePrerequisites({
      commandExistsFn: () => true,
      spawnFn: () => ({ success: true, stdout: 'v2.0', stderr: '' }),
    })

    expect(result.ok).toBe(true)
  })

  test('prereq auto-install on Debian', async () => {
    let dockerInstalled = false
    const spawnCalls: string[][] = []

    const result = await ensurePrerequisites({
      commandExistsFn: (cmd: string) => {
        if (cmd === 'git') return true
        if (cmd === 'docker') return dockerInstalled
        return false
      },
      spawnFn: (args: string[]) => {
        spawnCalls.push(args)
        const cmd = args.join(' ')
        if (cmd.includes('get.docker.com')) {
          dockerInstalled = true
          return { success: true, stdout: '', stderr: '' }
        }
        if (cmd.includes('docker compose version')) {
          return dockerInstalled
            ? { success: true, stdout: 'v2.0', stderr: '' }
            : { success: false, stdout: '', stderr: 'not found' }
        }
        return { success: true, stdout: '', stderr: '' }
      },
      isDebian: () => true,
      prompts: mockPrompts({ confirm: async () => true }),
      mode: 'deploy',
    })

    expect(result.ok).toBe(true)
    const aptCalls = spawnCalls.filter(a => a.join(' ').includes('apt-get'))
    expect(aptCalls.length).toBe(0) // git is present, no apt-get needed
    const dockerInstallCalls = spawnCalls.filter(a => a.join(' ').includes('get.docker.com'))
    expect(dockerInstallCalls.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// checkExistingDeployment
// ---------------------------------------------------------------------------

describe('install deploy', () => {
  test('detects existing deployment and shows menu', async () => {
    let selectCalled = false

    const result = await checkExistingDeployment({
      deployPath: '/deploy',
      fileExists: (p: string) => p.endsWith('docker-compose.yml') || p.endsWith('.env'),
      spawnFn: () => ({ success: true, stdout: '', stderr: '' }),
      prompts: mockPrompts({
        select: async () => { selectCalled = true; return 'restart' as never },
      }),
      mode: 'deploy',
    })

    expect(selectCalled).toBe(true)
    expect(result).toBe('restart')
  })

  test('dry-run skips all mutations', async () => {
    const spawnCalls: string[][] = []

    const result = await runInstall({
      dryRun: true,
      mode: 'deploy',
      deployPath: '/tmp/test-deploy',
      tmpdir: '/tmp/test-tmp',
      commandExistsFn: () => true,
      spawnFn: (args: string[]) => {
        spawnCalls.push(args)
        return { success: true, stdout: '', stderr: '' }
      },
      fileExists: () => false,
      writeFile: noop as never,
      chmod: noop as never,
      mkdir: noop as never,
      rmdir: noop as never,
      prompts: mockPrompts({
        select: async () => 'guided' as never,
      }),
      configureEnvFn: mockConfigureEnv(),
      validateEnvFn: mockValidateEnv(),
    })

    expect(result).toBe(0)
    const mutations = spawnCalls.filter(
      a => a.includes('clone') || (a.includes('up') && a.includes('-d'))
    )
    expect(mutations).toHaveLength(0)
  })

  test('env validation loop re-prompts on failure', async () => {
    const ENV_INVALID = 'BOT_TOKEN=\nMONGO_CONNECTION=\n'
    configureEnvQueue = [ENV_INVALID, ENV_VALID]

    let selectCalls = 0
    const prompts = mockPrompts({
      select: async () => { selectCalls++; return 'guided' as never },
    })

    const result = await runInstall({
      mode: 'deploy',
      deployPath: '/tmp/test-env',
      tmpdir: '/tmp/test-env-tmp',
      commandExistsFn: () => true,
      spawnFn: defaultSpawn,
      fileExists: (p: string) => p.includes('docker-compose.prod.yml') || p.includes('application.yml'),
      writeFile: noop as never,
      chmod: noop as never,
      mkdir: noop as never,
      rmdir: noop as never,
      copyFile: noop as never,
      prompts,
      configureEnvFn: mockConfigureEnv(),
      validateEnvFn: mockValidateEnv(),
    })

    expect(result).toBe(0)
    expect(selectCalls).toBe(2)
  })

  test('prereq check reports missing tools', async () => {
    const result = await runInstall({
      mode: 'deploy',
      commandExistsFn: (cmd: string) => cmd !== 'docker',
      spawnFn: () => ({ success: false, stdout: '', stderr: '' }),
      isDebian: () => false,
      prompts: mockPrompts(),
    })

    expect(result).toBe(1)
  })

  test('restart compose failure returns error', async () => {
    const result = await runInstall({
      mode: 'deploy',
      deployPath: '/tmp/test-restart',
      commandExistsFn: () => true,
      spawnFn: (args: string[]) => {
        if (args.includes('restart')) return { success: false, stdout: '', stderr: 'restart failed' }
        return { success: true, stdout: '', stderr: '' }
      },
      fileExists: (p: string) => p.endsWith('docker-compose.yml') || p.endsWith('.env'),
      prompts: mockPrompts({
        select: async () => 'restart' as never,
      }),
    })

    expect(result).toBe(1)
  })

  test('update compose failure returns error', async () => {
    const result = await runInstall({
      mode: 'deploy',
      deployPath: '/tmp/test-update',
      commandExistsFn: () => true,
      spawnFn: (args: string[]) => {
        if (args.includes('up') && args.includes('-d')) return { success: false, stdout: '', stderr: 'up failed' }
        return { success: true, stdout: '', stderr: '' }
      },
      fileExists: (p: string) => p.endsWith('docker-compose.yml') || p.endsWith('.env'),
      prompts: mockPrompts({
        select: async () => 'update' as never,
      }),
    })

    expect(result).toBe(1)
  })

  test('cleanup on compose up failure', async () => {
    let rmdirCalled = false
    let rmdirPath = ''

    const result = await runInstall({
      mode: 'deploy',
      deployPath: '/tmp/test-cleanup',
      tmpdir: '/tmp/test-cleanup-tmp',
      commandExistsFn: () => true,
      spawnFn: (args: string[]) => {
        if (args.includes('up') && args.includes('-d')) return { success: false, stdout: '', stderr: 'up failed' }
        return { success: true, stdout: '', stderr: '' }
      },
      fileExists: (p: string) => p.includes('docker-compose.prod.yml') || p.includes('application.yml'),
      writeFile: noop as never,
      chmod: noop as never,
      mkdir: noop as never,
      rmdir: ((p: string) => { rmdirCalled = true; rmdirPath = p }) as never,
      copyFile: noop as never,
      prompts: mockPrompts({
        select: async () => 'guided' as never,
      }),
      configureEnvFn: mockConfigureEnv(),
      validateEnvFn: mockValidateEnv(),
    })

    expect(result).toBe(1)
    expect(rmdirCalled).toBe(true)
    expect(rmdirPath).toBe('/tmp/test-cleanup-tmp')
  })
})

// ---------------------------------------------------------------------------
// Dev mode
// ---------------------------------------------------------------------------

describe('install dev', () => {
  test('clones full repo', async () => {
    const spawnCalls: string[][] = []

    const result = await runInstall({
      mode: 'dev',
      deployPath: '/tmp/test-dev',
      commandExistsFn: () => true,
      spawnFn: (args: string[]) => {
        spawnCalls.push(args)
        return { success: true, stdout: '', stderr: '' }
      },
      fileExists: () => false,
      prompts: mockPrompts(),
      configureEnvFn: mockConfigureEnv(),
      validateEnvFn: mockValidateEnv(),
    })

    expect(result).toBe(0)
    const cloneCall = spawnCalls.find(a => a.includes('clone'))
    expect(cloneCall).toBeDefined()
    expect(cloneCall).not.toContain('--depth')
  })

  test('detects existing .git and suggests update', async () => {
    const result = await checkExistingDeployment({
      deployPath: '/dev/amina',
      fileExists: (p: string) => p.endsWith('.git'),
      mode: 'dev',
    })

    expect(result).toBe('abort')
  })
})

// ---------------------------------------------------------------------------
// parseFlags
// ---------------------------------------------------------------------------

describe('parseFlags', () => {
  test('parses --dry-run --force --mode dev', () => {
    const flags = parseFlags(['node', 'amina', 'install', '--dry-run', '--force', '--mode', 'dev'])

    expect(flags.dryRun).toBe(true)
    expect(flags.force).toBe(true)
    expect(flags.mode).toBe('dev')
  })

  test('defaults to deploy mode', () => {
    const flags = parseFlags(['node', 'amina', 'install'])

    expect(flags.dryRun).toBe(false)
    expect(flags.force).toBe(false)
    expect(flags.mode).toBe('deploy')
  })
})
