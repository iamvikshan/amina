import type { BotClient } from '@src/structures'

/**
 * Notify the dashboard to refresh guild data
 * @param {BotClient} client - The Discord bot client
 * @param {string} guildId - The guild ID to refresh
 * @param {string} eventType - The event type ('join' or 'leave')
 * @returns {Promise<void>}
 */
export async function notifyDashboard(
  client: BotClient,
  guildId: string,
  eventType: string = 'refresh'
): Promise<void> {
  if (!process.env.BASE_URL?.trim() || !process.env.WEBHOOK_SECRET?.trim()) {
    return
  }

  try {
    // Create abort controller with 10 second timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(`${process.env.BASE_URL}/api/guild/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({ guildId }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      client.logger.success(`Dashboard notified of guild ${eventType}`)
    } else {
      const errorText = await response.text()
      client.logger.error(
        `Dashboard webhook failed (${response.status}): ${errorText}`
      )
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      client.logger.error('Dashboard webhook timed out after 10 seconds')
    } else {
      client.logger.error(`Failed to notify dashboard: ${err.message}`)
    }
  }
}
