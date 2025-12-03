import { ChatInputCommandInteraction, ComponentType } from 'discord.js'
import { model as ReactionRoleModel } from '@src/database/schemas/ReactionRoles'
import { getSettings } from '@src/database/schemas/Guild'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

export default async function statusSettings(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const settings: any = await getSettings(interaction.guild)

  const allFields: Array<{ name: string; value: string }> = []

  // 1. Prefix setting
  allFields.push({
    name: '1. prefix',
    value: `current prefix: \`${settings.prefix}\`\n> use \`/settings prefix\` to change it!`,
  })

  // 2. Log Channel
  const logChannel = settings.moderation.log_channel
    ? `<#${settings.moderation.log_channel}>`
    : 'not set yet'
  allFields.push({
    name: '2. log channel',
    value: `current log channel: ${logChannel}\n> use \`/logs channel\` to set it up!`,
  })

  // 3. Max Warns
  allFields.push({
    name: '3. max warns',
    value: `current max warns: ${settings.moderation.max_warns.limit}\naction: ${settings.moderation.max_warns.action}\n> use \`/maxwarn\` to configure it!`,
  })

  // 4. Welcome/Farewell
  const welcomeChannel = settings.welcome.enabled
    ? `<#${settings.welcome.channel}>`
    : 'not enabled'
  const farewellChannel = settings.farewell.enabled
    ? `<#${settings.farewell.channel}>`
    : 'not enabled'
  allFields.push({
    name: '4. welcome & farewell',
    value: `welcome: ${welcomeChannel}\nfarewell: ${farewellChannel}\n> use \`/welcome\` or \`/farewell\` to set them up!`,
  })

  // 5. Autorole
  const autoroles =
    settings.autorole && settings.autorole.length > 0
      ? settings.autorole.map((r: any) => `<@&${r}>`).join(', ')
      : 'not set yet'
  allFields.push({
    name: '5. auto role',
    value: `current autoroles: ${autoroles}\n> use \`/autorole\` to manage them!`,
  })

  // 6. Counter Channels
  const counterInfo = Object.entries(settings.counters)
    .filter(([_, value]) => value && typeof value === 'object')
    .map(([key, value]) => {
      const counter = value as any
      return `${key}: <#${counter.channel_id}>`
    })

  allFields.push({
    name: '6. counter channels',
    value:
      counterInfo.length > 0
        ? `${counterInfo.join('\n')}\n> use \`/counter\` to set them up!`
        : 'no counters set up yet\n> use `/counter` to create some!',
  })

  // 7. Ticket System
  const ticketChannel = settings.ticket.log_channel
    ? `<#${settings.ticket.log_channel}>`
    : 'not set yet'
  const ticketCategories = settings.ticket.topics?.length || 0
  allFields.push({
    name: '7. ticket system',
    value: `log channel: ${ticketChannel}\ncategories: ${ticketCategories}\n> use \`/ticket\` to configure the system!`,
  })

  // 8. Automod
  const automodSettings = settings.automod
  const automodStatus = [
    `anti-ghostping: ${automodSettings.anti_ghostping ? 'enabled' : 'disabled'}`,
    `anti-spam: ${automodSettings.anti_spam ? 'enabled' : 'disabled'}`,
    `anti-massmention: ${automodSettings.anti_massmention ? 'enabled' : 'disabled'}`,
    `auto-delete links: ${automodSettings.anti_links ? 'enabled' : 'disabled'}`,
    `auto-delete invites: ${automodSettings.anti_invites ? 'enabled' : 'disabled'}`,
    `auto-delete attachments: ${automodSettings.anti_attachments ? 'enabled' : 'disabled'}`,
  ].join('\n')

  allFields.push({
    name: '8. automod',
    value: `${automodStatus}\n> use \`/automod\` to configure these settings!`,
  })

  // 9. Suggestions
  const suggestionChannel = settings.suggestions.channel_id
    ? `<#${settings.suggestions.channel_id}>`
    : 'not set yet'
  allFields.push({
    name: '9. suggestions',
    value: `channel: ${suggestionChannel}\napproval: ${settings.suggestions.enabled ? 'enabled' : 'disabled'}\n> use \`/suggestion\` to manage the system!`,
  })

  // 10. Stats Channels
  const statsInfo = Object.entries(settings.stats)
    .filter(([_, value]) => value && typeof value === 'object')
    .map(([key, value]) => {
      const stat = value as any
      return `${key}: <#${stat.channel || stat.channel_id}>`
    })

  allFields.push({
    name: '10. stats channels',
    value:
      statsInfo.length > 0
        ? `${statsInfo.join('\n')}\n> use \`/stats\` to configure them!`
        : 'no stats channels set up yet\n> use `/stats` to create some!',
  })

  // 11. Staff Roles
  const staffRoles =
    settings.server.staff_roles.length > 0
      ? settings.server.staff_roles.map((r: string) => `<@&${r}>`).join(', ')
      : 'not set yet'
  allFields.push({
    name: '11. staff roles',
    value: `current staff roles: ${staffRoles}\n> use \`/settings staffadd\` or \`/settings staffremove\` to manage them!`,
  })

  // 12. Active Giveaways (if any)
  const giveawaysManager = (interaction.client as any).giveawaysManager
  if (giveawaysManager) {
    const activeGiveaways = giveawaysManager.giveaways.filter(
      (g: any) => g.guildId === interaction.guild?.id && !g.ended
    )

    const giveawayInfo = await Promise.all(
      activeGiveaways.map(async (giveaway: any) => {
        const channel = await interaction.guild?.channels
          .fetch(giveaway.channelId)
          .catch(() => null)
        const timeLeft = giveaway.endAt - Date.now()

        let status = 'running'
        if (giveaway.pauseOptions && giveaway.pauseOptions.isPaused) {
          status = 'paused'
        } else if (timeLeft <= 0) {
          status = 'ended'
        }

        return `prize: ${giveaway.prize}, [message](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}), channel: ${channel ? `<#${channel.id}>` : 'unknown'}
        ends: ${timeLeft > 0 ? `<t:${Math.floor(giveaway.endAt / 1000)}:R>` : 'ended'}, winners: ${giveaway.winnerCount}
        hosted by: ${giveaway.hostedBy ? `${giveaway.hostedBy}` : 'unknown'}, status: ${status}`
      })
    )

    allFields.push({
      name: '12. active giveaways',
      value: `${activeGiveaways.length} active giveaway(s):\n\n${giveawayInfo.join('\n\n')}\n\n> use \`/giveaway\` to manage giveaways!`,
    })
  }

  // 13. Reaction Roles
  const reactionRoles = await ReactionRoleModel.find({
    guild_id: interaction.guild?.id,
  }).lean()

  if (reactionRoles.length > 0) {
    const rrInfo = await Promise.all(
      reactionRoles.map(async (rr: any) => {
        const channel = await interaction.guild?.channels
          .fetch(rr.channel_id)
          .catch(() => null)
        const rolesMentions = rr.roles
          .map((role: any) => `${role.emote} <@&${role.role_id}>`)
          .join(', ')

        return `[message](https://discord.com/channels/${rr.guild_id}/${rr.channel_id}/${rr.message_id}) in ${channel ? `<#${channel.id}>` : 'unknown channel'}\n   roles: ${rolesMentions}`
      })
    )

    allFields.push({
      name: '13. reaction roles',
      value: `${reactionRoles.length} reaction role message(s) set up:\n\n${rrInfo.join('\n\n')}\n\n> use \`/reactionrole\` to manage reaction roles!`,
    })
  }

  const totalPages = Math.ceil(allFields.length / 4)
  let currentPage = 1

  const generateEmbed = (page: number) => {
    const startIndex = (page - 1) * 4
    const endIndex = startIndex + 4
    const fieldsToShow = allFields.slice(startIndex, endIndex)

    return MinaEmbed.primary()
      .setTitle("mina's current settings")
      .setDescription(
        "hey there! let's take a peek at your current settings! i'm so excited to show you what we've got set up!"
      )
      .addFields(fieldsToShow)
      .setFooter({
        text: `${mina.sayf('generic.pagination', { current: page.toString(), total: totalPages.toString() })} - remember, I'm always here to help you set things up! Don't be shy to ask!`,
      })
  }

  const generateButtons = (page: number) => {
    return MinaRows.prevNext(page === 1, page === totalPages)
  }

  const initialEmbed = generateEmbed(currentPage)
  const initialButtons = generateButtons(currentPage)

  const reply = await interaction.followUp({
    embeds: [initialEmbed],
    components: [initialButtons],
  })

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 890000, // 14 minutes 50 seconds (just under Discord's 15-minute limit)
  })

  collector.on('collect', async i => {
    if (i.customId === 'prev') {
      currentPage--
    } else if (i.customId === 'next') {
      currentPage++
    }

    const newEmbed = generateEmbed(currentPage)
    const newButtons = generateButtons(currentPage)

    try {
      await i.update({ embeds: [newEmbed], components: [newButtons] })
    } catch (error) {
      console.error('Failed to update interaction:', error)
      // Attempt to send a new message if updating fails
      try {
        await i.followUp({
          content: mina.say('error'),
          embeds: [newEmbed],
          components: [newButtons],
          ephemeral: true,
        })
      } catch (followUpError) {
        console.error('Failed to send follow-up message:', followUpError)
      }
    }
  })

  collector.on('end', () => {
    try {
      reply.edit({ components: [] })
    } catch (error) {
      console.error('Failed to remove components after collector end:', error)
    }
  })
}
