import {
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  ActionRowBuilder,
  UserSelectMenuBuilder,
  TextChannel,
  MessageFlags,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaRows } from '@helpers/componentHelper'
import { isTicketChannel } from '@handlers/ticket/shared/utils'
import Logger from '@helpers/Logger'

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
        MinaEmbed.error(
          'this operation can only be used in ticket channels.\n\n' +
            'please run this command from within an active ticket channel.'
        ),
      ],
      components: [MinaRows.backRow('ticket:btn:back_manage')],
    })
    return
  }

  const embed = MinaEmbed.primary()
    .setAuthor({ name: 'remove users from ticket' })
    .setDescription(
      'select the users you want to remove from this ticket channel.\n\n' +
        'selected users will no longer be able to view or send messages in this ticket.'
    )
    .setFooter({ text: 'you can select up to 10 users at once' })

  const userSelect =
    new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId('ticket:user:remove')
        .setPlaceholder('select users to remove...')
        .setMinValues(1)
        .setMaxValues(10)
    )

  const backRow = MinaRows.backRow('ticket:btn:back_manage')

  await interaction.update({
    embeds: [embed],
    components: [userSelect, backRow],
  })
}

/**
 * Handle user selection for removing from ticket
 */
export async function handleRemoveUserSelect(
  interaction: UserSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  // Validate channel is a TextChannel
  if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
    Logger.error('handleRemoveUserSelect: Invalid channel type')
    await interaction.followUp({
      content: 'this operation can only be used in text channels.',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const channel = interaction.channel
  const users = interaction.users

  if (users.size === 0) {
    await interaction.followUp({
      content: 'no users selected',
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
      Logger.error(`Failed to remove user ${user.tag} from ticket:`, error)
      const errorMessage =
        error instanceof Error ? error.message : 'failed to update permissions'
      results.push({
        user: user.tag,
        success: false,
        reason: errorMessage,
      })
    }
  }

  // Build results embed
  const successCount = results.filter(r => r.success).length
  const failedCount = results.length - successCount

  const embed = successCount > 0 ? MinaEmbed.success() : MinaEmbed.error()
  embed.setAuthor({ name: 'remove users result' })

  const successList = results
    .filter(r => r.success)
    .map(r => `${r.user}`)
    .join('\n')

  const failedList = results
    .filter(r => !r.success)
    .map(r => `${r.user} - ${r.reason}`)
    .join('\n')

  let description = `**summary:**\nremoved: ${successCount}\nfailed: ${failedCount}\n\n`

  if (successList) {
    description += `**successfully removed:**\n${successList}\n\n`
  }

  if (failedList) {
    description += `**failed to remove:**\n${failedList}`
  }

  embed.setDescription(description)

  const backRow = MinaRows.backRow('ticket:btn:back_manage')

  await interaction.editReply({
    embeds: [embed],
    components: [backRow],
  })
}
