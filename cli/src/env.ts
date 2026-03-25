import { createInterface } from 'node:readline'
import { randomUUID } from 'node:crypto'
import { accessSync, readFileSync } from 'node:fs'
import type { PromptsFn } from './shared'

type EnvVar = {
  key: string
  prompt: string
  secret?: boolean
  required?: boolean
}

type EnvCategory = {
  name: string
  description: string
  vars: EnvVar[]
  optional?: boolean
}

export const ENV_CATEGORIES: EnvCategory[] = [
  {
    name: 'Required',
    description: 'Bot will not start without these',
    vars: [
      {
        key: 'BOT_TOKEN',
        prompt: 'Discord Bot Token from Developer Portal',
        secret: true,
        required: true,
      },
      {
        key: 'MONGO_CONNECTION',
        prompt: 'MongoDB connection string (e.g., mongodb+srv://...)',
        secret: true,
        required: true,
      },
    ],
  },
  {
    name: 'Lavalink',
    description: 'Music System',
    optional: true,
    vars: [
      {
        key: 'LAVALINK_PASS',
        prompt: 'Lavalink password (leave empty to auto-generate)',
        secret: true,
      },
      { key: 'LAVALINK_1_HOST', prompt: 'Primary node host' },
      { key: 'LAVALINK_1_PORT', prompt: 'Primary node port' },
      { key: 'LAVALINK_1_ID', prompt: 'Primary node identifier' },
      {
        key: 'LAVALINK_2_HOST',
        prompt: 'Secondary node host (leave empty to skip)',
      },
      { key: 'LAVALINK_2_PORT', prompt: 'Secondary node port' },
      { key: 'LAVALINK_2_ID', prompt: 'Secondary node identifier' },
    ],
  },
  {
    name: 'Music Services',
    description: 'Spotify (requires local Lavalink)',
    optional: true,
    vars: [
      { key: 'SPOTIFY_CLIENT_ID', prompt: 'Spotify API client ID' },
      { key: 'SPOTIFY_CLIENT_SECRET', prompt: 'Spotify API client secret' },
    ],
  },
  {
    name: 'Optional Features',
    description: 'Webhooks and AI keys',
    optional: true,
    vars: [
      { key: 'WEBHOOK_SECRET', prompt: 'Dashboard webhook auth secret' },
      { key: 'LOGS_WEBHOOK', prompt: 'Discord webhook for bot logs' },
      { key: 'MISTRAL', prompt: 'Mistral AI API key' },
      { key: 'GEMINI', prompt: 'Gemini AI API key' },
      { key: 'VOYAGE', prompt: 'Voyage AI API key' },
      { key: 'VOYAGE_MONGO', prompt: 'Voyage MongoDB connection string' },
    ],
  },
  {
    name: 'Utility Commands',
    description: 'Weather, image, GitHub',
    optional: true,
    vars: [
      { key: 'WEATHERSTACK_KEY', prompt: 'Weather command API key' },
      { key: 'STRANGE_API_KEY', prompt: 'Image manipulation API key' },
    ],
  },
  {
    name: 'Monitoring',
    description: 'Error tracking',
    optional: true,
    vars: [
      {
        key: 'HONEYBADGER_API_KEY',
        prompt: 'Honeybadger error tracking API key',
      },
    ],
  },
]

const REQUIRED_KEYS = ['BOT_TOKEN', 'MONGO_CONNECTION']

const ALL_KEYS = ENV_CATEGORIES.flatMap(c => c.vars.map(v => v.key))

export type EnvMode = 'guided' | 'paste' | 'import'

export type EnvDependencies = {
  fileExists?: (path: string) => boolean
  readFile?: (path: string) => string
  input?: NodeJS.ReadableStream
}

/**
 * Parse KEY=VALUE lines, skipping comments and blanks.
 * @param content
 */
function parseEnv(content: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    let value = trimmed.slice(eqIdx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    map.set(trimmed.slice(0, eqIdx).trim(), value)
  }
  return map
}

/**
 * Validate env content string for required and optional keys.
 * @param content
 */
export function validateEnv(content: string): {
  ok: boolean
  errors: string[]
  warnings: string[]
} {
  const parsed = parseEnv(content)
  const errors: string[] = []
  const warnings: string[] = []

  for (const key of REQUIRED_KEYS) {
    if (!parsed.has(key) || !parsed.get(key)) {
      errors.push(`Missing required variable: ${key}`)
    }
  }

  for (const key of ALL_KEYS) {
    if (REQUIRED_KEYS.includes(key)) continue
    if (!parsed.has(key) || !parsed.get(key)) {
      warnings.push(`Missing optional variable: ${key}`)
    }
  }

  return { ok: errors.length === 0, errors, warnings }
}

/**
 * Interactive guided env configuration.
 * @param prompts
 */
export async function envGuidedMode(prompts: PromptsFn): Promise<string> {
  const lines: string[] = []

  for (const category of ENV_CATEGORIES) {
    if (category.optional) {
      const configure = await prompts.confirm({
        message: `Configure ${category.name}? (${category.description})`,
      })
      if (prompts.isCancel(configure)) {
        prompts.cancel('Configuration cancelled.')
        throw new Error('User cancelled')
      }
      if (!configure) {
        for (const v of category.vars) lines.push(`${v.key}=`)
        continue
      }
    }

    for (const v of category.vars) {
      const fn = v.secret ? prompts.password : prompts.text
      const value = await fn({ message: v.prompt })
      if (prompts.isCancel(value)) {
        prompts.cancel('Configuration cancelled.')
        throw new Error('User cancelled')
      }

      let resolved = String(value)
      if (v.key === 'LAVALINK_PASS' && !resolved) {
        resolved = randomUUID().replace(/-/g, '').slice(0, 24)
      }
      lines.push(`${v.key}=${resolved}`)
    }
  }

  return lines.join('\n')
}

/**
 * Paste env content line-by-line from stdin.
 * @param prompts
 * @param input
 */
export async function envPasteMode(
  prompts: PromptsFn,
  input?: NodeJS.ReadableStream
): Promise<string> {
  prompts.log.info(
    'Paste your .env content below. Enter two empty lines to finish.'
  )
  const lines: string[] = []
  let consecutiveEmpty = 0
  const rl = createInterface({
    input: input ?? process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.on('line', line => {
      if (line.trim() === '') {
        consecutiveEmpty++
        if (consecutiveEmpty >= 2) {
          rl.close()
          return
        }
        lines.push(line)
      } else {
        consecutiveEmpty = 0
        lines.push(line)
      }
    })
    rl.on('close', () => resolve(lines.join('\n')))
  })
}

/**
 * Import env from an existing file path.
 * @param prompts
 * @param deps
 */
export async function envImportMode(
  prompts: PromptsFn,
  deps: EnvDependencies = {}
): Promise<string> {
  const fileExists =
    deps.fileExists ??
    ((p: string) => {
      try {
        accessSync(p)
        return true
      } catch {
        return false
      }
    })
  const readFile = deps.readFile ?? ((p: string) => readFileSync(p, 'utf8'))

  const filePath = await prompts.text({
    message: 'Path to .env file',
    placeholder: './path/to/.env',
  })
  if (prompts.isCancel(filePath)) {
    prompts.cancel('Configuration cancelled.')
    throw new Error('User cancelled')
  }

  const resolved = String(filePath)
  if (!fileExists(resolved)) {
    throw new Error(`File not found: ${resolved}`)
  }

  return readFile(resolved)
}

/**
 * Run env configuration in the selected mode.
 * @param prompts
 * @param mode
 * @param deps
 */
export async function configureEnv(
  prompts: PromptsFn,
  mode: EnvMode,
  deps?: EnvDependencies
): Promise<string> {
  switch (mode) {
    case 'guided':
      return envGuidedMode(prompts)
    case 'paste':
      return envPasteMode(prompts, deps?.input)
    case 'import':
      return envImportMode(prompts, deps)
  }
}
