import { describe, test, expect } from 'bun:test'
import permissions from '../src/data/aiPermissions.json'

describe('aiPermissions.json structure', () => {
  test('has valid overrides section', () => {
    expect(permissions.overrides).toBeDefined()
    expect(permissions.overrides.userRequestOnly).toBeArray()
    expect(permissions.overrides.privileged).toBeArray()
  })

  test('has valid freeWill section', () => {
    expect(permissions.freeWill).toBeDefined()
    expect(permissions.freeWill.exceptions).toBeArray()
    expect(permissions.freeWill.limits).toBeDefined()
  })

  test('has valid categories section', () => {
    expect(permissions.categories.allowed).toBeArray()
    expect(permissions.categories.neverRegister).toBeArray()
  })

  test('has injectionPatterns array', () => {
    expect(permissions.injectionPatterns).toBeArray()
    expect(permissions.injectionPatterns.length).toBeGreaterThan(0)
  })
})

describe('overrides', () => {
  test('userRequestOnly contains exactly 6 commands', () => {
    const expected = ['gamble', 'bank', 'report', 'stop', 'leave', 'tictactoe']
    expect(permissions.overrides.userRequestOnly.sort()).toEqual(expected.sort())
  })

  test('privileged contains giveaway and add', () => {
    expect(permissions.overrides.privileged).toContain('giveaway')
    expect(permissions.overrides.privileged).toContain('add')
  })

  test('no command in both userRequestOnly and privileged', () => {
    const overlap = permissions.overrides.userRequestOnly.filter((cmd: string) =>
      permissions.overrides.privileged.includes(cmd)
    )
    expect(overlap).toHaveLength(0)
  })
})

describe('freeWill', () => {
  test('exceptions are valid privileged command names', () => {
    expect(permissions.freeWill.exceptions).toEqual([
      'timeout',
      'warn',
      'purge',
    ])
  })

  test('every exception has a limits entry', () => {
    for (const cmd of permissions.freeWill.exceptions) {
      expect(
        permissions.freeWill.limits[cmd as keyof typeof permissions.freeWill.limits]
      ).toBeDefined()
    }
  })
})

describe('descriptions', () => {
  test('userRequestOnly description mentions financial risk', () => {
    expect(permissions.descriptions.userRequestOnly).toContain('financial risk')
  })
})
