/**
 * Logger Utility for Amina API
 *
 * Provides structured logging with Discord webhook integration for errors/warnings.
 * Uses Cloudflare Workers' waitUntil() to send webhooks in the background without
 * blocking API responses.
 *
 * Inspired by the main bot's Logger class but adapted for Workers environment.
 */

import type { Context } from 'hono';

/**
 * Convert Shoutrrr Discord URL format to standard Discord webhook URL
 * Shoutrrr format: discord://TOKEN@WEBHOOK_ID
 * Standard format: https://discord.com/api/webhooks/WEBHOOK_ID/TOKEN
 */
function toDiscordWebhookUrl(
  shoutrrrUrl: string | undefined
): string | undefined {
  if (!shoutrrrUrl) return undefined;

  // Check if it's already a standard Discord webhook URL
  if (shoutrrrUrl.startsWith('https://discord.com/api/webhooks/')) {
    return shoutrrrUrl;
  }

  // Parse Shoutrrr format
  const match = shoutrrrUrl.match(/^discord:\/\/([^@]+)@(\d+)$/);
  if (!match) {
    console.warn('Invalid Shoutrrr webhook format:', shoutrrrUrl);
    return undefined;
  }

  const [, token, webhookId] = match;
  return `https://discord.com/api/webhooks/${webhookId}/${token}`;
}

/**
 * Logger class for structured logging with Discord webhook integration
 */
export class Logger {
  private webhookUrl: string | undefined;
  private isProduction: boolean;

  constructor(private c: Context<any, any, any>) {
    this.webhookUrl = toDiscordWebhookUrl(c.env.LOGS_WEBHOOK);
    this.isProduction =
      c.env.DOPPLER_ENVIRONMENT === 'prd' ||
      c.env.DOPPLER_ENVIRONMENT === 'production';
  }

  /**
   * Log an informational message (console only)
   */
  info(message: string, details?: Record<string, unknown>): void {
    if (details !== undefined) {
      console.log(message, details);
    } else {
      console.log(message);
    }
  }

  /**
   * Log a warning with Discord webhook notification
   */
  warn(message: string, details?: Record<string, unknown>): void {
    // Always log to console for Cloudflare dashboard
    if (details !== undefined) {
      console.warn(message, details);
    } else {
      console.warn(message);
    }

    // Always send to Discord webhook if configured (non-blocking)
    if (this.webhookUrl) {
      this.sendToDiscord('warning', message, details);
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
        console.error(message, error.message, error.stack, details);
      } else {
        console.error(message, error.message, error.stack);
      }
    } else if (error !== undefined) {
      if (details !== undefined) {
        console.error(message, error, details);
      } else {
        console.error(message, error);
      }
    } else {
      if (details !== undefined) {
        console.error(message, details);
      } else {
        console.error(message);
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
      };
      this.sendToDiscord('error', message, mergedDetails);
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
    if (!this.webhookUrl) return;

    const colors = {
      warning: 0xffa500, // Orange
      error: 0xff0000, // Red
    };

    const embed: DiscordEmbed = {
      author: {
        name: level.toUpperCase(),
      },
      title: message.length > 256 ? message.substring(0, 253) + '...' : message,
      color: colors[level],
      timestamp: new Date().toISOString(),
    };

    // Add details as fields or description
    if (details && Object.keys(details).length > 0) {
      const fields: DiscordEmbed['fields'] = [];

      for (const [key, value] of Object.entries(details)) {
        // Skip undefined/null values
        if (value === undefined || value === null) continue;

        let fieldValue: string;

        if (typeof value === 'string') {
          fieldValue = value;
        } else if (value instanceof Error) {
          fieldValue = this.isProduction
            ? value.message
            : value.stack || value.message;
        } else {
          fieldValue = JSON.stringify(value, null, 2);
        }

        // Truncate long values
        if (fieldValue.length > 1024) {
          fieldValue = fieldValue.substring(0, 1021) + '...';
        }

        fields.push({
          name: key,
          value: fieldValue || 'N/A',
          inline: fieldValue.length < 50,
        });
      }

      if (fields.length > 0) {
        embed.fields = fields;
      }
    }

    const payload: DiscordWebhookPayload = {
      username: 'Amina API Logs',
      embeds: [embed],
    };

    // Use waitUntil to send webhook in background without blocking response
    const webhookPromise = fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          console.error(
            'Failed to send Discord webhook:',
            res.status,
            res.statusText
          );
        }
      })
      .catch((err) => {
        console.error('Error sending Discord webhook:', err);
      });

    // Schedule background execution (doesn't block response)
    this.c.executionCtx.waitUntil(webhookPromise);
  }
}

/**
 * Create a logger instance from Hono context
 */
export function createLogger(c: Context<any, any, any>): Logger {
  return new Logger(c);
}
