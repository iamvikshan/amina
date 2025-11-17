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
 * Show user select for removing users from ticket
 */
export async function showRemoveUserSelect(
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
    .setAuthor({ name: '➖ Remove Users from Ticket' })
    .setDescription(
      'Select the users you want to remove from this ticket channel.\n\n' +
        'Selected users will no longer be able to view or send messages in this ticket.'
    )
    .setFooter({ text: 'You can select up to 10 users at once' })

  const userSelect =
    new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId('ticket:user:remove')
        .setPlaceholder('👥 Select users to remove...')
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
 * Handle user selection for removing from ticket
 */
export async function handleRemoveUserSelect(
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

  // Remove each user from the ticket
  for (const [userId, user] of users) {
    try {
      await channel.permissionOverwrites.create(userId, {
        ViewChannel: false,
        SendMessages: false,
        ReadMessageHistory: false,
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
    .setAuthor({ name: '➖ Remove Users Result' })

  const successList = results
    .filter(r => r.success)
    .map(r => `✅ ${r.user}`)
    .join('\n')

  const failedList = results
    .filter(r => !r.success)
    .map(r => `❌ ${r.user} - ${r.reason}`)
    .join('\n')

  let description = `**Summary:**\n✅ Removed: ${successCount}\n❌ Failed: ${failedCount}\n\n`

  if (successList) {
    description += `**Successfully Removed:**\n${successList}\n\n`
  }

  if (failedList) {
    description += `**Failed to Remove:**\n${failedList}`
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
