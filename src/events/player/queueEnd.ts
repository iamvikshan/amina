import { MUSIC, EMBED_COLORS } from '@src/config'
import { EmbedBuilder } from 'discord.js'
import type { BotClient } from '@src/structures'
import type { Player } from 'lavalink-client'

/**
 * Handles queue end events
 * @param {BotClient} client - The bot client instance
 * @param {Player} player - The player whose queue ended
 */
export default async (client: BotClient, player: Player): Promise<void> => {
  const guild = client.guilds.cache.get(player.guildId)
  if (!guild) return

  if (player.voiceChannelId) {
    await client.utils.setVoiceStatus(
      client,
      player.voiceChannelId,
      'Silence? Use /play to start the beat!'
    )
  }

  if (player.volume > 100) {
    await player.setVolume(MUSIC.DEFAULT_VOLUME)
  }

  const msg: any = player.get('message')
  if (msg && msg.deletable) {
    await msg.delete().catch(() => {})
  }

  const channel: any = guild.channels.cache.get(player.textChannelId)
  if (channel) {
    await channel.safeSend(
      {
        embeds: [
          new EmbedBuilder()
            .setColor(EMBED_COLORS.BOT_EMBED)
            .setTitle('Queue Concluded')
            .setDescription(
              `Enjoying music with me? Consider [voting](https://top.gg/bot/${client.user?.id}/vote) for me!`
            ),
        ],
      },
      10
    )
  }
}
