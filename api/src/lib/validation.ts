/**
 * Shared validation utilities for the Amina API
 */

/** Fields that must be finite non-negative numbers in bot stats */
export const numericStatFields = [
  'guilds',
  'members',
  'channels',
  'commands',
  'ping',
  'uptime',
] as const

/**
 * Validate bot stats payload.
 * Each numeric field must be a finite, non-negative number.
 */
export function validateBotStats(stats: Record<string, unknown>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  for (const field of numericStatFields) {
    const value = stats[field]
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push(`${field} must be a finite number`)
    } else if (value < 0) {
      errors.push(`${field} must not be negative`)
    }
  }

  return { valid: errors.length === 0, errors }
}
