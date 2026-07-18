import type { BotClient } from '@src/structures'

/**
 * Warning event handler
 * @param {BotClient} client - The bot client instance
 * @param {string} message - The warning message
 * @returns {void} Nothing.
 */
export default async (client: BotClient, message: string): Promise<void> => {
  client.logger.warn(`Client Warning: ${message}`)
}
