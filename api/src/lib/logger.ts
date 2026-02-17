/**
 * Logger Utility for Amina API
 *
 * Provides structured logging with Discord webhook integration for errors/warnings.
 * Uses Cloudflare Workers' waitUntil() to send webhooks in the background without
 * blocking API responses.
 *
 * Inspired by the main bot's Logger class but adapted for Workers environment.
 */

import type { Context } from 'hono'

/**
 * Convert Shoutrrr Discord URL format to standard Discord webhook URL
 * Shoutrrr format: discord://TOKEN@WEBHOOK_ID
 * Standard format: https://discord.com/api/webhooks/WEBHOOK_ID/TOKEN
 */
function toDiscordWebhookUrl(
  shoutrrrUrl: string | undefined
): string | undefined {
  if (!shoutrrrUrl) return undefined

  // Check if it's already a standard Discord webhook URL
  if (shoutrrrUrl.startsWith('https://discord.com/api/webhooks/')) {
    return shoutrrrUrl
  }

  // Parse Shoutrrr format
  const match = shoutrrrUrl.match(/^discord:\/\/([^@]+)@(\d+)$/)
  if (!match) {
    console.warn('Invalid Shoutrrr webhook format (URL redacted)')
    return undefined
  }

  const [, token, webhookId] = match
  return `https://discord.com/api/webhooks/${webhookId}/${token}`
}

/**
 * Simple rate limiter for Discord webhook sends.
 * Enforces a minimum interval between sends and queues messages during cooldown.
 */
const webhookRateLimiter = {
  lastSendTime: 0,
  minIntervalMs: 1000, // 1 second between sends
  queue: [] as Array<{
    url: string
    payload: string
    resolve: () => void
    reject: (err: unknown) => void
  }>,
  processing: false,

  canSend(): boolean {
    return Date.now() - this.lastSendTime >= this.minIntervalMs
  },

  enqueue(url: string, payload: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ url, payload, resolve, reject })
      if (!this.processing) {
        this.processQueue()
      }
    })
  },

  async processQueue(): Promise<void> {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const elapsed = now - this.lastSendTime
      if (elapsed < this.minIntervalMs) {
        await new Promise(r => setTimeout(r, this.minIntervalMs - elapsed))
      }

      const item = this.queue.shift()
      if (!item) break

      try {
        const res = await fetch(item.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: item.payload,
        })
        if (!res.ok) {
          console.error(
            'Failed to send Discord webhook:',
            res.status,
            res.statusText
          )
        }
        item.resolve()
      } catch (err) {
        console.error('Error sending Discord webhook:', err)
        item.reject(err)
      }
      this.lastSendTime = Date.now()
    }

    this.processing = false
  },
}

/**
 * Logger class for structured logging with Discord webhook integration
 */
export class Logger {
  private webhookUrl: string | undefined
  private isProduction: boolean

  constructor(private c: Context<any, any, any>) {
    this.webhookUrl = toDiscordWebhookUrl(c.env.LOGS_WEBHOOK)
    this.isProduction =
      c.env.DOPPLER_ENVIRONMENT === 'prd' ||
      c.env.DOPPLER_ENVIRONMENT === 'production'
  }

  /**
   * Log an informational message (console only)
   */
  info(message: string, details?: Record<string, unknown>): void {
    if (details !== undefined) {
      console.log(message, details)
    } else {
      console.log(message)
    }
  }

  /**
   * Log a warning with Discord webhook notification
   */
  warn(message: string, details?: Record<string, unknown>): void {
    // Always log to console for Cloudflare dashboard
    if (details !== undefined) {
      console.warn(message, details)
    } else {
      console.warn(message)
    }

    // Always send to Discord webhook if configured (non-blocking)
    if (this.webhookUrl) {
      this.sendToDiscord('warning', message, details)
    }
  }

  /**
   * Log an error with Discord webhook notification
   */
  error(
    message: string,
    error?: Error | unknown,
    details?: Record<string, unknown>
  ): void {
    // Log to console
    if (error instanceof Error) {
      if (details !== undefined) {
        console.error(message, error.message, error.stack, details)
      } else {
        console.error(message, error.message, error.stack)
      }
    } else if (error !== undefined) {
      if (details !== undefined) {
        console.error(message, error, details)
      } else {
        console.error(message, error)
      }
    } else {
      if (details !== undefined) {
        console.error(message, details)
      } else {
        console.error(message)
      }
    }

    // Always send to Discord webhook if configured (non-blocking)
    if (this.webhookUrl) {
      const mergedDetails = {
        ...details,
        ...(error instanceof Error && {
          error: error.message,
          // Include stack trace in webhook, but truncate in production for safety
          stack: this.isProduction ? undefined : error.stack,
        }),
      }
      this.sendToDiscord('error', message, mergedDetails)
    }
  }

  /**
   * Send log message to Discord webhook (runs in background via waitUntil)
   */
  private sendToDiscord(
    level: 'warning' | 'error',
    message: string,
    details?: Record<string, unknown>
  ): void {
    if (!this.webhookUrl) return

    const colors = {
      warning: 0xffa500, // Orange
      error: 0xff0000, // Red
    }

    const embed: DiscordEmbed = {
      author: {
        name: level.toUpperCase(),
      },
      title: message.length > 256 ? message.substring(0, 253) + '...' : message,
      color: colors[level],
      timestamp: new Date().toISOString(),
    }

    // Add details as fields or description
    if (details && Object.keys(details).length > 0) {
      const fields: DiscordEmbed['fields'] = []

      for (const [key, value] of Object.entries(details)) {
        // Skip undefined/null values
        if (value === undefined || value === null) continue

        let fieldValue: string

        if (typeof value === 'string') {
          fieldValue = value
        } else if (value instanceof Error) {
          fieldValue = this.isProduction
            ? value.message
            : value.stack || value.message
        } else {
          try {
            fieldValue = JSON.stringify(value, null, 2)
          } catch {
            fieldValue = '[Unserializable value]'
          }
        }

        // Truncate long values
        if (fieldValue.length > 1024) {
          fieldValue = fieldValue.substring(0, 1021) + '...'
        }

        fields.push({
          name: key,
          value: fieldValue || 'N/A',
          inline: fieldValue.length < 50,
        })
      }

      if (fields.length > 0) {
        embed.fields = fields
      }
    }

    const payload: DiscordWebhookPayload = {
      username: 'Amina API Logs',
      embeds: [embed],
    }

    // Use rate-limited webhook sending to avoid Discord rate limits
    const payloadStr = JSON.stringify(payload)
    const webhookPromise = webhookRateLimiter.enqueue(
      this.webhookUrl,
      payloadStr
    )

    // Schedule background execution (doesn't block response)
    this.c.executionCtx.waitUntil(webhookPromise)
  }
}

/**
 * Create a logger instance from Hono context
 */
export function createLogger(c: Context<any, any, any>): Logger {
  return new Logger(c)
}
