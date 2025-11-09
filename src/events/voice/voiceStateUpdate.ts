import statsHandler from '@handlers/stats'
import type BotClient from '@structures/BotClient'
import type { VoiceState } from 'discord.js'

/**
 * Voice state update event handler
 */
export default async (
  client: BotClient,
  oldState: VoiceState,
  newState: VoiceState
): Promise<void> => {
  // Track voice stats
  statsHandler.trackVoiceStats(oldState, newState)

  // Erela.js
  if (client.config.MUSIC.ENABLED) {
    const guild = oldState.guild

    // if nobody left the channel in question, return.
    if (
      oldState.channelId !== guild.members.me?.voice.channelId ||
      newState.channel
    )
      return

    // otherwise, check how many people are in the channel now
    if (oldState.channel && oldState.channel.members.size === 1) {
      setTimeout(() => {
        // if 1 (you), wait 1 minute
        if (oldState.channel && oldState.channel.members.size - 1 === 0) {
          const player = client.musicManager?.getPlayer(guild.id)
          if (player) client.musicManager?.getPlayer(guild.id)?.destroy() // destroy the player
        }
      }, client.config.MUSIC.IDLE_TIME * 1000)
    }
  }
}

