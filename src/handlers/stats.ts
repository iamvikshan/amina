import { getMemberStats } from '@schemas/MemberStats'
import { getRandomInt } from '@helpers/Utils'
import type { Message, Interaction, VoiceState, GuildMember } from 'discord.js'
import type BotClient from '@structures/BotClient'

const cooldownCache = new Map<string, number>()
const voiceStates = new Map<string, number>()

const xpToAdd = (): number => getRandomInt(19) + 1

/**
 * Parse level-up message with placeholders
 */
const parse = (content: string, member: GuildMember, level: number): string => {
  return content
    .replaceAll(/\\n/g, '\n')
    .replaceAll(/{server}/g, member.guild.name)
    .replaceAll(/{count}/g, member.guild.memberCount.toString())
    .replaceAll(/{member:id}/g, member.id)
    .replaceAll(/{member:name}/g, member.displayName)
    .replaceAll(/{member:mention}/g, member.toString())
    .replaceAll(/{member:tag}/g, member.user.tag)
    .replaceAll(/{level}/g, level.toString())
}

export default {
  /**
   * This function saves stats for a new message
   */
  async trackMessageStats(
    message: Message,
    isCommand: boolean,
    settings: any
  ): Promise<void> {
    if (!message.guildId || !message.member) return

    const statsDb = await getMemberStats(message.guildId, message.member.id)
    statsDb.messages++

    // TODO: Ignore possible bot commands

    // Cooldown check to prevent Message Spamming
    const key = `${message.guildId}|${message.member.id}`
    if (cooldownCache.has(key)) {
      const lastUsed = cooldownCache.get(key)
      if (lastUsed) {
        const difference = (Date.now() - lastUsed) * 0.001
        if (
          difference < (message.client as BotClient).config.STATS.XP_COOLDOWN
        ) {
          return statsDb.save()
        }
      }
      cooldownCache.delete(key)
    }

    // Update member's XP in DB
    statsDb.xp += xpToAdd()

    // Check if member has levelled up
    let { xp, level } = statsDb
    const needed = level * level * 100

    if (xp > needed) {
      level += 1
      xp -= needed

      statsDb.xp = xp
      statsDb.level = level
      let lvlUpMessage = settings.stats.xp.message
      lvlUpMessage = parse(lvlUpMessage, message.member, level)

      const xpChannel =
        settings.stats.xp.channel &&
        message.guild.channels.cache.get(settings.stats.xp.channel)
      const lvlUpChannel = xpChannel || message.channel

      ;(lvlUpChannel as any).safeSend(lvlUpMessage)
    }
    await statsDb.save()
    cooldownCache.set(key, Date.now())
  },

  /**
   * Track interaction stats (slash commands, context menus)
   */
  async trackInteractionStats(interaction: Interaction): Promise<void> {
    if (!interaction.guild || !interaction.member || !interaction.guildId)
      return
    const statsDb = await getMemberStats(
      interaction.guildId,
      (interaction.member as GuildMember).id
    )
    if (interaction.isChatInputCommand()) statsDb.commands.slash += 1
    if (interaction.isUserContextMenuCommand()) statsDb.contexts.user += 1
    if (interaction.isMessageContextMenuCommand()) statsDb.contexts.message += 1
    await statsDb.save()
  },

  /**
   * Track voice channel stats (connections and time)
   */
  async trackVoiceStats(
    oldState: VoiceState,
    newState: VoiceState
  ): Promise<void> {
    const oldChannel = oldState.channel
    const newChannel = newState.channel

    if (!oldChannel && !newChannel) return
    if (!newState.member) return

    const member = await newState.member.fetch().catch(() => null)
    if (!member || member.user.bot) return

    // Member joined a voice channel
    if (!oldChannel && newChannel) {
      const statsDb = await getMemberStats(member.guild.id, member.id)
      statsDb.voice.connections += 1
      await statsDb.save()
      voiceStates.set(member.id, Date.now())
    }

    // Member left a voice channel
    if (oldChannel && !newChannel) {
      const statsDb = await getMemberStats(member.guild.id, member.id)
      if (voiceStates.has(member.id)) {
        const joinTime = voiceStates.get(member.id)
        if (joinTime) {
          const time = Date.now() - joinTime
          statsDb.voice.time += time / 1000 // add time in seconds
          await statsDb.save()
        }
        voiceStates.delete(member.id)
      }
    }
  },
}
