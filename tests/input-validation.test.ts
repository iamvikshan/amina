import { describe, test, expect } from 'bun:test'

// Import the functions we're testing
import {
  parseNumberOrDefault,
  validateHexColor,
} from '../api/src/lib/svg-utils'
import { validateBotStats } from '../api/src/lib/validation'

describe('parseNumberOrDefault', () => {
  test('returns parsed number for valid string', () => {
    expect(parseNumberOrDefault('42', 0)).toBe(42)
  })

  test('returns parsed float for valid decimal string', () => {
    expect(parseNumberOrDefault('3.14', 0)).toBe(3.14)
  })

  test('returns default for undefined', () => {
    expect(parseNumberOrDefault(undefined, 10)).toBe(10)
  })

  test('returns default for empty string', () => {
    expect(parseNumberOrDefault('', 10)).toBe(10)
  })

  test('returns default for NaN string', () => {
    expect(parseNumberOrDefault('abc', 5)).toBe(5)
  })

  test('returns default for NaN (just whitespace)', () => {
    expect(parseNumberOrDefault('   ', 7)).toBe(7)
  })

  test('clamps to min when value is below min', () => {
    expect(parseNumberOrDefault('0', 10, 1, 100)).toBe(1)
  })

  test('clamps to max when value exceeds max', () => {
    expect(parseNumberOrDefault('500', 10, 1, 100)).toBe(100)
  })

  test('returns value when within min/max range', () => {
    expect(parseNumberOrDefault('50', 10, 1, 100)).toBe(50)
  })

  test('handles negative values', () => {
    expect(parseNumberOrDefault('-5', 0, -10, 10)).toBe(-5)
  })

  test('clamps with only min provided', () => {
    expect(parseNumberOrDefault('-100', 0, 0)).toBe(0)
  })

  test('clamps with only max provided', () => {
    expect(parseNumberOrDefault('9999', 0, undefined, 100)).toBe(100)
  })

  test('returns default for Infinity string', () => {
    expect(parseNumberOrDefault('Infinity', 5)).toBe(5)
  })

  test('returns default for -Infinity string', () => {
    expect(parseNumberOrDefault('-Infinity', 5)).toBe(5)
  })
})

describe('validateHexColor', () => {
  test('accepts valid 3-char hex', () => {
    expect(validateHexColor('#fff')).toBe(true)
  })

  test('accepts valid 6-char hex', () => {
    expect(validateHexColor('#ff00aa')).toBe(true)
  })

  test('accepts valid 8-char hex (with alpha)', () => {
    expect(validateHexColor('#ff00aa80')).toBe(true)
  })

  test('accepts valid 4-char hex (with alpha)', () => {
    expect(validateHexColor('#fffa')).toBe(true)
  })

  test('accepts uppercase hex', () => {
    expect(validateHexColor('#AABBCC')).toBe(true)
  })

  test('accepts mixed case hex', () => {
    expect(validateHexColor('#aAbBcC')).toBe(true)
  })

  test('rejects missing hash', () => {
    expect(validateHexColor('ff00aa')).toBe(false)
  })

  test('rejects invalid characters', () => {
    expect(validateHexColor('#gghhii')).toBe(false)
  })

  test('rejects too short', () => {
    expect(validateHexColor('#ff')).toBe(false)
  })

  test('rejects 5-digit hex', () => {
    expect(validateHexColor('#12345')).toBe(false)
  })

  test('rejects 7-digit hex', () => {
    expect(validateHexColor('#1234567')).toBe(false)
  })

  test('rejects too long', () => {
    expect(validateHexColor('#ff00aa8011')).toBe(false)
  })

  test('rejects empty string', () => {
    expect(validateHexColor('')).toBe(false)
  })

  test('rejects injection attempt', () => {
    expect(validateHexColor('#fff"><script>')).toBe(false)
  })
})

describe('Negative stats rejection', () => {
  // Tests the shared validateBotStats utility (also used in internal bots route)

  test('accepts valid stats', () => {
    const stats = {
      guilds: 100,
      members: 5000,
      channels: 300,
      commands: 50,
      ping: 45,
      uptime: 86400,
    }
    const result = validateBotStats(stats)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('rejects negative guilds', () => {
    const stats = {
      guilds: -1,
      members: 5000,
      channels: 300,
      commands: 50,
      ping: 45,
      uptime: 86400,
    }
    const result = validateBotStats(stats)
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('guilds')
  })

  test('rejects negative members', () => {
    const stats = {
      guilds: 100,
      members: -500,
      channels: 300,
      commands: 50,
      ping: 45,
      uptime: 86400,
    }
    const result = validateBotStats(stats)
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('members')
  })

  test('rejects multiple negative fields', () => {
    const stats = {
      guilds: -1,
      members: -500,
      channels: -10,
      commands: 50,
      ping: 45,
      uptime: 86400,
    }
    const result = validateBotStats(stats)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBe(3)
  })

  test('rejects NaN values', () => {
    const stats = {
      guilds: NaN,
      members: 5000,
      channels: 300,
      commands: 50,
      ping: 45,
      uptime: 86400,
    }
    const result = validateBotStats(stats)
    expect(result.valid).toBe(false)
  })

  test('rejects Infinity values', () => {
    const stats = {
      guilds: Infinity,
      members: 5000,
      channels: 300,
      commands: 50,
      ping: 45,
      uptime: 86400,
    }
    const result = validateBotStats(stats)
    expect(result.valid).toBe(false)
  })

  test('accepts zero values', () => {
    const stats = {
      guilds: 0,
      members: 0,
      channels: 0,
      commands: 0,
      ping: 0,
      uptime: 0,
    }
    const result = validateBotStats(stats)
    expect(result.valid).toBe(true)
  })
})
