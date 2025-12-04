// @root/src/config/secrets.ts
// Centralized secret management - all sensitive credentials should be accessed through this module

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
  if (process.env.LAVALINK_ID_1 && process.env.LAVALINK_HOST_1) {
    nodes.push({
      id: process.env.LAVALINK_ID_1,
      host: process.env.LAVALINK_HOST_1,
      port: process.env.LAVALINK_PORT_1
        ? Number(process.env.LAVALINK_PORT_1)
        : undefined,
      authorization: process.env.LAVALINK_PASSWORD_1,
      secure: process.env.LAVALINK_SECURE_1 === 'true',
    })
  }

  // Node 2
  if (process.env.LAVALINK_ID_2 && process.env.LAVALINK_HOST_2) {
    nodes.push({
      id: process.env.LAVALINK_ID_2,
      host: process.env.LAVALINK_HOST_2,
      port: process.env.LAVALINK_PORT_2
        ? Number(process.env.LAVALINK_PORT_2)
        : undefined,
      authorization: process.env.LAVALINK_PASSWORD_2,
      secure: process.env.LAVALINK_SECURE_2 === 'true',
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
  get UPSTASH_VECTOR() {
    return getOptionalSecret('UPSTASH_VECTOR')
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
  get OPENAI() {
    return getOptionalSecret('OPENAI')
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
