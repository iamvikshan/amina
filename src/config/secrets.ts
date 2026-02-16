// @root/src/config/secrets.ts
// Centralized secret management - all sensitive credentials should be accessed through this module

import Logger from '@helpers/Logger'

// Secrets type is globally available from types/global.d.ts

/**
 * Get a required secret from environment variables
 * @throws Error if the secret is not set
 */
function getRequiredSecret(key: keyof Secrets): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Required secret ${key} is not set in environment variables`
    )
  }
  return value
}

/**
 * Get an optional secret from environment variables
 */
function getOptionalSecret(key: keyof Secrets): string | undefined {
  return process.env[key]
}

/**
 * Get Lavalink nodes from environment variables
 */
function getLavalinkNodes(): Secrets['LAVALINK_NODES'] {
  const nodes: Secrets['LAVALINK_NODES'] = []

  // Node 1
  if (process.env.LAVALINK_1_ID && process.env.LAVALINK_1_HOST) {
    nodes.push({
      id: process.env.LAVALINK_1_ID,
      host: process.env.LAVALINK_1_HOST,
      port: process.env.LAVALINK_1_PORT
        ? Number(process.env.LAVALINK_1_PORT)
        : undefined,
      authorization: process.env.LAVALINK_PASS,
      secure: false,
    })
  }

  // Node 2
  if (process.env.LAVALINK_2_ID && process.env.LAVALINK_2_HOST) {
    nodes.push({
      id: process.env.LAVALINK_2_ID,
      host: process.env.LAVALINK_2_HOST,
      port: process.env.LAVALINK_2_PORT
        ? Number(process.env.LAVALINK_2_PORT)
        : undefined,
      authorization: process.env.LAVALINK_PASS,
      secure: false,
    })
  }

  return nodes
}

/**
 * Validate that all required secrets are present
 * @throws Error if any required secret is missing
 */
export function validateSecrets(): void {
  getRequiredSecret('BOT_TOKEN')
  getRequiredSecret('MONGO_CONNECTION')
}

/**
 * Log credential precedence when both Vertex AI service account
 * and GEMINI_KEY are present. Does not enforce presence of any secret —
 * SA JSON validation happens downstream in configCache.getConfig().
 */
export function logCredentialPrecedence(): void {
  const hasServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const hasGeminiKey = !!process.env.GEMINI_KEY

  if (hasServiceAccount && hasGeminiKey) {
    Logger.log(
      'Vertex AI credentials detected alongside GEMINI_KEY — Vertex credentials will take precedence'
    )
  }
}

/**
 * Convert Shoutrrr Discord URL format to standard Discord webhook URL
 * Shoutrrr format: discord://TOKEN@WEBHOOK_ID
 * Standard format: https://discord.com/api/webhooks/WEBHOOK_ID/TOKEN
 */
function toDiscordWebhookUrl(
  shoutrrrUrl: string | undefined
): string | undefined {
  if (!shoutrrrUrl) return undefined
  const match = shoutrrrUrl.match(/^discord:\/\/([^@]+)@(\d+)$/)
  if (!match) return shoutrrrUrl // Return as-is if already a standard URL
  const [, token, webhookId] = match
  return `https://discord.com/api/webhooks/${webhookId}/${token}`
}

/**
 * Type-safe access to secrets
 * All secrets should be accessed through this object
 */
export const secrets: Secrets = {
  // Bot & Database
  get BOT_TOKEN() {
    return getRequiredSecret('BOT_TOKEN')
  },
  get MONGO_CONNECTION() {
    return getRequiredSecret('MONGO_CONNECTION')
  },
  get LOGS_WEBHOOK() {
    return toDiscordWebhookUrl(getOptionalSecret('LOGS_WEBHOOK'))
  },

  // API Keys & Tokens
  get GEMINI_KEY() {
    return getOptionalSecret('GEMINI_KEY')
  },
  get GOOGLE_SERVICE_ACCOUNT_JSON() {
    return getOptionalSecret('GOOGLE_SERVICE_ACCOUNT_JSON')
  },
  get VERTEX_PROJECT_ID() {
    return getOptionalSecret('VERTEX_PROJECT_ID')
  },
  get VERTEX_REGION() {
    return getOptionalSecret('VERTEX_REGION')
  },
  get WEATHERSTACK_KEY() {
    return getOptionalSecret('WEATHERSTACK_KEY')
  },
  get STRANGE_API_KEY() {
    return getOptionalSecret('STRANGE_API_KEY')
  },
  get GH_TOKEN() {
    return getOptionalSecret('GH_TOKEN')
  },
  get SPOTIFY_CLIENT_ID() {
    return getOptionalSecret('SPOTIFY_CLIENT_ID')
  },
  get SPOTIFY_CLIENT_SECRET() {
    return getOptionalSecret('SPOTIFY_CLIENT_SECRET')
  },
  get HONEYBADGER_API_KEY() {
    return getOptionalSecret('HONEYBADGER_API_KEY')
  },
  get WEBHOOK_SECRET() {
    return getOptionalSecret('WEBHOOK_SECRET')
  },

  // Lavalink Nodes
  get LAVALINK_NODES() {
    return getLavalinkNodes()
  },
}

// Export as secret (singular) for convenience
export const secret = secrets
