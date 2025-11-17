import type { BotClient } from '@src/structures'
import { updatePresence } from './update'

/**
 * Initialize and handle bot presence updates
 * Updates both presence and bot statistics every 10 minutes
 * Migrated from handlers/presence.ts
 * @param client - The bot client instance
 */
export default async function handlePresence(client: BotClient): Promise<void> {
  await updatePresence(client)

  // Update every 10 minutes (matches dashboard cache TTL)
  setInterval(() => updatePresence(client), 10 * 60 * 1000)
}
