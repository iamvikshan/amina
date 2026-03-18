import { describe, expect, test } from 'bun:test'

import { formatDashboard, showDashboard, pollHealth } from '../src/health'
import type { PromptsFn } from '../src/shared'

function mockPrompts(): PromptsFn & { logCalls: string[] } {
  const logCalls: string[] = []
  return {
    text: async () => '',
    password: async () => '',
    select: async <T>() => '' as unknown as T,
    confirm: async () => true,
    spinner: () => ({ start: () => {}, stop: () => {}, message: () => {} }),
    intro: () => {},
    outro: () => {},
    cancel: () => {},
    isCancel: (_value: unknown): _value is symbol => false,
    log: {
      info: (msg: string) => logCalls.push(msg),
      warn: (msg: string) => logCalls.push(msg),
      error: (msg: string) => logCalls.push(msg),
      success: (msg: string) => logCalls.push(msg),
      step: (msg: string) => logCalls.push(msg),
      message: (msg: string) => logCalls.push(msg),
    },
    logCalls,
  }
}

describe('formatDashboard', () => {
  test('formats healthy services', () => {
    const statuses = {
      amina: 'healthy',
      lavalink: 'healthy',
      cloudflared: 'running',
      watchtower: 'running',
    }
    const lines = formatDashboard(statuses, '/opt/amina')
    const output = lines.join('\n')
    expect(output).toContain('[+] amina: healthy')
    expect(output).toContain('[+] lavalink: healthy')
    expect(output).toContain('[+] cloudflared: running')
    expect(output).toContain('[+] watchtower: running')
    expect(output).toContain('View logs:')
  })

  test('formats mixed states with failure markers', () => {
    const statuses = {
      amina: 'healthy',
      lavalink: 'starting',
      cloudflared: 'not found',
      watchtower: 'running',
    }
    const lines = formatDashboard(statuses, '/opt/amina')
    const output = lines.join('\n')
    expect(output).toContain('[+] amina: healthy')
    expect(output).toContain('[x] lavalink: starting')
    expect(output).toContain('[x] cloudflared: not found')
    expect(output).toContain('[+] watchtower: running')
  })
})

describe('showDashboard', () => {
  test('calls prompts.log for each line', () => {
    const statuses = {
      amina: 'healthy',
      lavalink: 'healthy',
      cloudflared: 'running',
      watchtower: 'running',
    }
    const prompts = mockPrompts()
    const lines = formatDashboard(statuses, '/opt/amina')

    showDashboard(statuses, '/opt/amina', prompts)

    expect(prompts.logCalls.length).toBe(lines.length)
  })
})

describe('pollHealth', () => {
  function mockSpawn(statuses: Record<string, string>) {
    return (args: string[]) => {
      const name = args[args.length - 1]
      const status = statuses[name] ?? 'not found'
      return { success: status !== 'not found', stdout: status, stderr: '' }
    }
  }

  test('returns healthy statuses when all services are ready', async () => {
    const spawnFn = mockSpawn({
      amina: 'healthy',
      lavalink: 'healthy',
      cloudflared: 'running',
      watchtower: 'running',
    })
    const prompts = mockPrompts()
    const result = await pollHealth(spawnFn, prompts, { timeout: 1000, interval: 50 })
    expect(result.amina).toBe('healthy')
    expect(result.lavalink).toBe('healthy')
    expect(result.cloudflared).toBe('running')
    expect(result.watchtower).toBe('running')
  })

  test('detects unhealthy services', async () => {
    const spawnFn = mockSpawn({
      amina: 'unhealthy',
      lavalink: 'healthy',
      cloudflared: 'running',
      watchtower: 'running',
    })
    const prompts = mockPrompts()
    const result = await pollHealth(spawnFn, prompts, { timeout: 1000, interval: 50 })
    expect(result.amina).toBe('unhealthy')
  })

  test('reports timeout when services stay non-ready', async () => {
    const spawnFn = mockSpawn({
      amina: 'starting',
      lavalink: 'starting',
      cloudflared: 'starting',
      watchtower: 'starting',
    })
    const prompts = mockPrompts()
    const result = await pollHealth(spawnFn, prompts, { timeout: 100, interval: 50 })
    expect(Object.values(result).some(s => s === 'starting')).toBe(true)
  })

  test('handles zero timeout without false success', async () => {
    const spawnFn = mockSpawn({})
    const prompts = mockPrompts()
    const result = await pollHealth(spawnFn, prompts, { timeout: 0, interval: 50 })
    expect(Object.keys(result).length).toBe(0)
  })
})
