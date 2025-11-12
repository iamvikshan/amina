import {
  EmbedBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { model as ReactionRoleModel } from '@src/database/schemas/ReactionRoles'
import { getSettings } from '@src/database/schemas/Guild'

export default async function statusSettings(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const settings: any = await getSettings(interaction.guild)

  const allFields: Array<{ name: string; value: string }> = []

  // 1. Prefix setting
  allFields.push({
    name: '1. Prefix 📝',
    value: `Current prefix: \`${settings.prefix}\`\n> Use \`/settings prefix\` to change it!`,
  })

  // 2. Log Channel
  const logChannel = settings.moderation.log_channel
    ? `<#${settings.moderation.log_channel}>`
    : 'Not set yet'
  allFields.push({
    name: '2. Log Channel 📋',
    value: `Current log channel: ${logChannel}\n> Use \`/logs channel\` to set it up!`,
  })

  // 3. Max Warns
  allFields.push({
    name: '3. Max Warns ⚠️',
    value: `Current max warns: ${settings.moderation.max_warns.limit}\nAction: ${settings.moderation.max_warns.action}\n> Use \`/maxwarn\` to configure it!`,
  })

  // 4. Welcome/Farewell
  const welcomeChannel = settings.welcome.enabled
    ? `<#${settings.welcome.channel}>`
    : 'Not enabled'
  const farewellChannel = settings.farewell.enabled
    ? `<#${settings.farewell.channel}>`
    : 'Not enabled'
  allFields.push({
    name: '4. Welcome & Farewell 👋',
    value: `Welcome: ${welcomeChannel}\nFarewell: ${farewellChannel}\n> Use \`/welcome\` or \`/farewell\` to set them up!`,
  })

  // 5. Autorole
  const autoroles =
    settings.autorole && settings.autorole.length > 0
      ? settings.autorole.map((r: any) => `<@&${r}>`).join(', ')
      : 'Not set yet'
  allFields.push({
    name: '5. Auto Role 🎭',
    value: `Current autoroles: ${autoroles}\n> Use \`/autorole\` to manage them!`,
  })

  // 6. Counter Channels
  const counterInfo = Object.entries(settings.counters)
    .filter(([_, value]) => value && typeof value === 'object')
    .map(([key, value]) => {
      const counter = value as any
      return `${key}: <#${counter.channel_id}>`
    })

  allFields.push({
    name: '6. Counter Channels 📊',
    value:
      counterInfo.length > 0
        ? `${counterInfo.join('\n')}\n> Use \`/counter\` to set them up!`
        : 'No counters set up yet\n> Use `/counter` to create some!',
  })

  // 7. Ticket System
  const ticketChannel = settings.ticket.log_channel
    ? `<#${settings.ticket.log_channel}>`
    : 'Not set yet'
  const ticketCategories = settings.ticket.topics?.length || 0
  allFields.push({
    name: '7. Ticket System 🎫',
    value: `Log Channel: ${ticketChannel}\nCategories: ${ticketCategories}\n> Use \`/ticket\` to configure the system!`,
  })

  // 8. Automod
  const automodSettings = settings.automod
  const automodStatus = [
    `Anti-ghostping: ${automodSettings.anti_ghostping ? '✅' : '❌'}`,
    `Anti-spam: ${automodSettings.anti_spam ? '✅' : '❌'}`,
    `Anti-massmention: ${automodSettings.anti_massmention ? '✅' : '❌'}`,
    `Auto-delete links: ${automodSettings.anti_links ? '✅' : '❌'}`,
    `Auto-delete invites: ${automodSettings.anti_invites ? '✅' : '❌'}`,
    `Auto-delete attachments: ${automodSettings.anti_attachments ? '✅' : '❌'}`,
  ].join('\n')

  allFields.push({
    name: '8. Automod 🛡️',
    value: `${automodStatus}\n> Use \`/automod\` to configure these settings!`,
  })

  // 9. Suggestions
  const suggestionChannel = settings.suggestions.channel_id
    ? `<#${settings.suggestions.channel_id}>`
    : 'Not set yet'
  allFields.push({
    name: '9. Suggestions 💡',
    value: `Channel: ${suggestionChannel}\nApproval: ${settings.suggestions.enabled ? '✅' : '❌'}\n> Use \`/suggestion\` to manage the system!`,
  })

  // 10. Stats Channels
  const statsInfo = Object.entries(settings.stats)
    .filter(([_, value]) => value && typeof value === 'object')
    .map(([key, value]) => {
      const stat = value as any
      return `${key}: <#${stat.channel || stat.channel_id}>`
    })

  allFields.push({
    name: '10. Stats Channels 📈',
    value:
      statsInfo.length > 0
        ? `${statsInfo.join('\n')}\n> Use \`/stats\` to configure them!`
        : 'No stats channels set up yet\n> Use `/stats` to create some!',
  })

  // 11. Staff Roles
  const staffRoles =
    settings.server.staff_roles.length > 0
      ? settings.server.staff_roles.map((r: string) => `<@&${r}>`).join(', ')
      : 'Not set yet'
  allFields.push({
    name: '11. Staff Roles 👮',
    value: `Current staff roles: ${staffRoles}\n> Use \`/settings staffadd\` or \`/settings staffremove\` to manage them!`,
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

        let status = '🏁 Running'
        if (giveaway.pauseOptions && giveaway.pauseOptions.isPaused) {
          status = '⏸️ Paused'
        } else if (timeLeft <= 0) {
          status = '🎊 Ended'
        }

        return `🎉 Prize: ${giveaway.prize}, [📨 Message](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}), 📍 Channel: ${channel ? `<#${channel.id}>` : 'IDK'}
        🕒 Ends: ${timeLeft > 0 ? `<t:${Math.floor(giveaway.endAt / 1000)}:R>` : 'Ended'}, 👥 Winners: ${giveaway.winnerCount}
        🏆 Hosted by: ${giveaway.hostedBy ? `${giveaway.hostedBy}` : 'IDK'}, 📊 Status: ${status}`
      })
    )

    allFields.push({
      name: '12. Active Giveaways 🎁',
      value: `${activeGiveaways.length} active giveaway(s):\n\n${giveawayInfo.join('\n\n')}\n\n> Use \`/giveaway\` to manage giveaways!`,
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

        return `📌 [Message](https://discord.com/channels/${rr.guild_id}/${rr.channel_id}/${rr.message_id}) in ${channel ? `<#${channel.id}>` : 'Unknown Channel'}\n   Roles: ${rolesMentions}`
      })
    )

    allFields.push({
      name: '13. Reaction Roles 🎭',
      value: `${reactionRoles.length} reaction role message(s) set up:\n\n${rrInfo.join('\n\n')}\n\n> Use \`/reactionrole\` to manage reaction roles!`,
    })
  }

  const totalPages = Math.ceil(allFields.length / 4)
  let currentPage = 1

  const generateEmbed = (page: number) => {
    const startIndex = (page - 1) * 4
    const endIndex = startIndex + 4
    const fieldsToShow = allFields.slice(startIndex, endIndex)

    return new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setTitle("Mina's current Settings")
      .setDescription(
        "Hey there! Let's take a peek at your current settings! I'm so excited to show you what we've got set up! 🎉"
      )
      .addFields(fieldsToShow)
      .setFooter({
        text: `Page ${page}/${totalPages} • Remember, I'm always here to help you set things up! Don't be shy to ask! 💖`,
      })
  }

  const generateButtons = (page: number) => {
    const row = new ActionRowBuilder<ButtonBuilder>()

    if (page > 1) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⬅️')
      )
    }

    if (page < totalPages) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('➡️')
      )
    }

    return row
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
          content:
            "Oopsie! 😅 I had a little hiccup updating the message. Here's a fresh one for you!",
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
