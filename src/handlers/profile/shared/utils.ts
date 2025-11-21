/**
 * Shared utility functions for profile handlers
 */

export interface BirthdateValidation {
  isValid: boolean
  date?: Date
  error?: string
}

/**
 * Validates and parses a birthdate string
 */
export function validateBirthdate(birthdate: string): BirthdateValidation {
  const ddmmyyyyRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const mmyyyyRegex = /^(\d{2})\/(\d{4})$/

  let day: number, month: number, year: number

  if (ddmmyyyyRegex.test(birthdate)) {
    const match = birthdate.match(ddmmyyyyRegex)
    if (!match)
      return {
        isValid: false,
        error: 'invalid date format! use DD/MM/YYYY or MM/YYYY',
      }
    const [, d, m, y] = match
    day = parseInt(d)
    month = parseInt(m) - 1 // JS months are 0-based
    year = parseInt(y)
  } else if (mmyyyyRegex.test(birthdate)) {
    const match = birthdate.match(mmyyyyRegex)
    if (!match)
      return {
        isValid: false,
        error: 'invalid date format! use DD/MM/YYYY or MM/YYYY',
      }
    const [, m, y] = match
    day = 1
    month = parseInt(m) - 1
    year = parseInt(y)
  } else {
    return {
      isValid: false,
      error: 'invalid date format! use DD/MM/YYYY or MM/YYYY',
    }
  }

  const date = new Date(year, month, day)

  // Validate date components
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    (day && date.getDate() !== day)
  ) {
    return { isValid: false, error: "that date doesn't exist!" }
  }

  // Check if date is in the future
  if (date > new Date()) {
    return {
      isValid: false,
      error: "time traveler detected! date can't be in the future",
    }
  }

  // Check if user is too young/old (e.g., under 13 or over 100)
  const age = calculateAge(date)
  if (age < 13) {
    return { isValid: false, error: 'sorry! you must be at least 13 years old' }
  }
  if (age > 100) {
    return {
      isValid: false,
      error: 'hmm, that seems a bit too far back. check the year?',
    }
  }

  return { isValid: true, date }
}

/**
 * Calculates age from birthdate
 */
export function calculateAge(birthdate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthdate.getFullYear()
  const monthDiff = today.getMonth() - birthdate.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthdate.getDate())
  ) {
    age--
  }

  return age
}
