// @root/src/config/secrets.ts
// Centralized secret management - all sensitive credentials should be accessed through this module

// Secrets type is globally available from types/global.d.ts

/**
 * Get a required secret from environment variables
 * @param {keyof Secrets} key - The key
 * @throws Error if the secret is not set
 * @returns {string} The result string.
 */
function getRequiredSecret(key: keyof Secrets): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Required secret ${key} is not set in environment variables`,
    )
  }
  return value
}

/**
 * Get an optional secret from environment variables
 * @param {keyof Secrets} key - The key
 * @returns {string | undefined} The result.
 */
function getOptionalSecret(key: keyof Secrets): string | undefined {
  return process.env[key]
}

/**
 * Get Lavalink nodes from environment variables
 * @returns {Secrets['LAVALINK_NODES']} The result.
 */
function getLavalinkNodes(): Secrets['LAVALINK_NODES'] {
  const nodes: Secrets['LAVALINK_NODES'] = []

  // Node 1
  if (process.env.LAVALINK_1_ID && process.env.LAVALINK_1_HOST) {
    nodes.push({
      id: process.env.LAVALINK_1_ID,
      host: process.env.LAVALINK_1_HOST,
      ...(process.env.LAVALINK_1_PORT && {
        port: Number(process.env.LAVALINK_1_PORT),
      }),
      ...(process.env.LAVALINK_PASS && {
        authorization: process.env.LAVALINK_PASS,
      }),
      secure: false,
    })
  }

  // Node 2
  if (process.env.LAVALINK_2_ID && process.env.LAVALINK_2_HOST) {
    nodes.push({
      id: process.env.LAVALINK_2_ID,
      host: process.env.LAVALINK_2_HOST,
      ...(process.env.LAVALINK_2_PORT && {
        port: Number(process.env.LAVALINK_2_PORT),
      }),
      ...(process.env.LAVALINK_PASS && {
        authorization: process.env.LAVALINK_PASS,
      }),
      secure: false,
    })
  }

  return nodes
}

/**
 * Validate that all required secrets are present
 * @throws Error if any required secret is missing
 * @returns {void} Nothing.
 */
export function validateSecrets(): void {
  getRequiredSecret('BOT_TOKEN')
  getRequiredSecret('MONGO_CONNECTION')
}

/**
 * Convert Shoutrrr Discord URL format to standard Discord webhook URL
 * Shoutrrr format: discord://TOKEN@WEBHOOK_ID
 * Standard format: https://discord.com/api/webhooks/WEBHOOK_ID/TOKEN
 * @param {string | undefined} shoutrrrUrl - The shoutrrr url
 * @returns {string | undefined} The result.
 */
function toDiscordWebhookUrl(
  shoutrrrUrl: string | undefined,
): string | undefined {
  if (!shoutrrrUrl) return undefined
  const match = shoutrrrUrl.match(/^discord:\/\/([^@]+)@(\d+)$/)
  if (!match) return shoutrrrUrl // Return as-is if already a standard URL
  const [, token, webhookId] = match
  return `https://discord.com/api/webhooks/${webhookId}/${token}`
}

/**
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
  get MISTRAL() {
    return getOptionalSecret('MISTRAL')
  },
  get GEMINI() {
    return getOptionalSecret('GEMINI')
  },
  get VOYAGE() {
    return getOptionalSecret('VOYAGE')
  },
  get VOYAGE_MONGO() {
    return getOptionalSecret('VOYAGE_MONGO')
  },
  get WEATHERSTACK_KEY() {
    return getOptionalSecret('WEATHERSTACK_KEY')
  },
  get STRANGE_API_KEY() {
    return getOptionalSecret('STRANGE_API_KEY')
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
