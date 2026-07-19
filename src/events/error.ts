import type { BotClient } from '@src/structures'

/**
 * Error event handler
 * @param {BotClient} client - The bot client instance
 * @param {Error} error - The error that occurred
 * @returns {void} Nothing.
 */
export default async (client: BotClient, error: Error): Promise<void> => {
  client.logger.error(`Client Error`, error)
}
