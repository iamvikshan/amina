import { GuildMember, EmbedBuilder } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import { getSettings } from '@schemas/Guild'
import type BotClient from '@structures/BotClient'

interface InviteData {
  tracked?: number
  added?: number
  fake?: number
  left?: number
}

interface InviterData {
  member_id?: string
  invite_data?: InviteData
}

interface GreetingConfig {
  enabled?: boolean
  channel?: string
  content?: string
  embed: {
    description?: string
    color?: string
    thumbnail?: boolean
    footer?: string
    image?: string
  }
}

/**
 * Parse greeting message with placeholders
 */
const parse = async (
  content: string,
  member: GuildMember,
  inviterData: InviterData = {}
): Promise<string> => {
  const inviteData: { name?: string; tag?: string } = {}

  const getEffectiveInvites = (inviteData: InviteData = {}): number =>
    (inviteData.tracked || 0) +
      (inviteData.added || 0) -
      (inviteData.fake || 0) -
      (inviteData.left || 0) || 0

  if (content.includes('{inviter:')) {
    const inviterId = inviterData.member_id || 'NA'
    if (inviterId !== 'VANITY' && inviterId !== 'NA') {
      try {
        const inviter = await (member.client as BotClient).users.fetch(
          inviterId
        )
        inviteData.name = inviter.username
        inviteData.tag = inviter.tag
      } catch (ex) {
        ;(member.client as BotClient).logger.error(
          `Parsing inviterId: ${inviterId}`,
          ex
        )
        inviteData.name = 'NA'
        inviteData.tag = 'NA'
      }
    } else if (member.user.bot) {
      inviteData.name = 'OAuth'
      inviteData.tag = 'OAuth'
    } else {
      inviteData.name = inviterId
      inviteData.tag = inviterId
    }
  }
  return content
    .replaceAll(/\\n/g, '\n')
    .replaceAll(/{server}/g, member.guild.name)
    .replaceAll(/{count}/g, member.guild.memberCount.toString())
    .replaceAll(/{member:nick}/g, member.displayName)
    .replaceAll(/{member:name}/g, member.user.username)
    .replaceAll(/{member:dis}/g, member.user.discriminator)
    .replaceAll(/{member:tag}/g, member.user.tag)
    .replaceAll(/{member:mention}/g, member.toString())
    .replaceAll(/{member:avatar}/g, member.displayAvatarURL())
    .replaceAll(/{inviter:name}/g, inviteData.name || '')
    .replaceAll(/{inviter:tag}/g, inviteData.tag || '')
    .replaceAll(
      /{invites}/g,
      getEffectiveInvites(inviterData.invite_data).toString()
    )
}

/**
 * Build greeting message with content and embed
 */
const buildGreeting = async (
  member: GuildMember,
  type: 'WELCOME' | 'FAREWELL',
  config: GreetingConfig,
  inviterData?: InviterData
): Promise<{ content?: string; embeds?: EmbedBuilder[] } | undefined> => {
  if (!config) return
  let content: string | undefined

  // build content
  if (config.content) content = await parse(config.content, member, inviterData)

  // build embed
  const embed = MinaEmbed.info()
  if (config.embed.description) {
    const parsed = await parse(config.embed.description, member, inviterData)
    embed.setDescription(parsed)
  }
  if (config.embed.color) embed.setColor(config.embed.color as any)
  if (config.embed.thumbnail) embed.setThumbnail(member.user.displayAvatarURL())
  if (config.embed.footer) {
    const parsed = await parse(config.embed.footer, member, inviterData)
    embed.setFooter({ text: parsed })
  }
  if (config.embed.image) {
    const parsed = await parse(config.embed.image, member)
    embed.setImage(parsed)
  }

  // set default message
  if (!config.content && !config.embed.description && !config.embed.footer) {
    content =
      type === 'WELCOME'
        ? mina.sayf('greetings.welcome', {
            user: member.displayName,
            server: member.guild.name,
          })
        : mina.sayf('greetings.farewell', {
            user: member.user.username,
            server: member.guild.name,
          })
    return { content }
  }

  return { content, embeds: [embed] }
}

/**
 * Send welcome message
 */
async function sendWelcome(
  member: GuildMember,
  inviterData: InviterData = {}
): Promise<void> {
  const settings = await getSettings(member.guild)
  const config = (settings as any)?.welcome as GreetingConfig | undefined
  if (!config || !config.enabled) return

  // check if channel exists
  const channel = member.guild.channels.cache.get(config.channel || '')
  if (!channel) return

  // build welcome message
  const response = await buildGreeting(member, 'WELCOME', config, inviterData)

  ;(channel as any).safeSend(response)
}

/**
 * Send farewell message
 */
async function sendFarewell(
  member: GuildMember,
  inviterData: InviterData = {}
): Promise<void> {
  const settings = await getSettings(member.guild)
  const config = (settings as any)?.farewell as GreetingConfig | undefined
  if (!config || !config.enabled) return

  // check if channel exists
  const channel = member.guild.channels.cache.get(config.channel || '')
  if (!channel) return

  // build farewell message
  const response = await buildGreeting(member, 'FAREWELL', config, inviterData)

  ;(channel as any).safeSend(response)
}

export default {
  buildGreeting,
  sendWelcome,
  sendFarewell,
}
