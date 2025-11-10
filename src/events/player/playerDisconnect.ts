import type { BotClient } from '@src/structures'
import type { Player } from 'lavalink-client'

/**
 * Handles player disconnect events
 * @param {BotClient} client - The bot client instance
 * @param {Player} player - The player that was disconnected
 */
export default async (client: BotClient, player: Player): Promise<void> => {
  const guild = client.guilds.cache.get(player.guildId)
  if (!guild) return

  if (player.voiceChannelId) {
    await client.utils.setVoiceStatus(client, player.voiceChannelId, '')
  }

  const msg: any = player.get('message')
  if (msg && msg.deletable) {
    await msg.delete().catch(() => {})
  }
}
