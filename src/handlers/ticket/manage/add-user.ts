import {
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  UserSelectMenuBuilder,
  TextChannel,
  MessageFlags,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'
import { isTicketChannel } from '@handlers/ticket/shared/utils'

/**
 * Show user select for adding users to ticket
 */
export async function showAddUserSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const channel = interaction.channel as TextChannel

  // Check if in ticket channel
  if (!isTicketChannel(channel)) {
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            '❌ This operation can only be used in ticket channels!\n\n' +
              'Please run this command from within an active ticket channel.'
          ),
      ],
      components: [
        createSecondaryBtn({
          customId: 'ticket:btn:back_manage',
          label: 'Back to Manage',
          emoji: '◀️',
        }),
      ],
    })
    return
  }

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: '➕ Add Users to Ticket' })
    .setDescription(
      'Select the users you want to add to this ticket channel.\n\n' +
        'Selected users will be able to view and send messages in this ticket.'
    )
    .setFooter({ text: 'You can select up to 10 users at once' })

  const userSelect =
    new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId('ticket:user:add')
        .setPlaceholder('👥 Select users to add...')
        .setMinValues(1)
        .setMaxValues(10)
    )

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back_manage',
    label: 'Back to Manage',
    emoji: '◀️',
  })

  await interaction.update({
    embeds: [embed],
    components: [userSelect, backButton],
  })
}

/**
 * Handle user selection for adding to ticket
 */
export async function handleAddUserSelect(
  interaction: UserSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const channel = interaction.channel as TextChannel
  const users = interaction.users

  if (users.size === 0) {
    await interaction.followUp({
      content: '❌ No users selected',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const results: { user: string; success: boolean; reason?: string }[] = []

  // Add each user to the ticket
  for (const [userId, user] of users) {
    try {
      // Check if user is a bot
      if (user.bot) {
        results.push({
          user: user.tag,
          success: false,
          reason: 'Cannot add bots to tickets',
        })
        continue
      }

      await channel.permissionOverwrites.create(userId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      })

      results.push({ user: user.tag, success: true })
    } catch (error) {
      results.push({
        user: user.tag,
        success: false,
        reason: 'Failed to update permissions',
      })
    }
  }

  // Build results embed
  const successCount = results.filter(r => r.success).length
  const failedCount = results.length - successCount

  const embed = new EmbedBuilder()
    .setColor(successCount > 0 ? EMBED_COLORS.SUCCESS : EMBED_COLORS.ERROR)
    .setAuthor({ name: '➕ Add Users Result' })

  const successList = results
    .filter(r => r.success)
    .map(r => `✅ ${r.user}`)
    .join('\n')

  const failedList = results
    .filter(r => !r.success)
    .map(r => `❌ ${r.user} - ${r.reason}`)
    .join('\n')

  let description = `**Summary:**\n✅ Added: ${successCount}\n❌ Failed: ${failedCount}\n\n`

  if (successList) {
    description += `**Successfully Added:**\n${successList}\n\n`
  }

  if (failedList) {
    description += `**Failed to Add:**\n${failedList}`
  }

  embed.setDescription(description)

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back_manage',
    label: 'Back to Manage',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [backButton],
  })
}
