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
    .setAuthor({ name: 'add users to ticket' })
    .setDescription(
      'select the users you want to add to this ticket channel.\n\n' +
        'selected users will be able to view and send messages in this ticket.'
    )
    .setFooter({ text: 'you can select up to 10 users at once' })

  const userSelect =
    new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId('ticket:user:add')
        .setPlaceholder('select users to add...')
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
      content: 'no users selected',
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
          reason: 'cannot add bots to tickets',
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
      Logger.error(`Failed to add user ${user.tag} to ticket:`, error)
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
  embed.setAuthor({ name: 'add users result' })

  const successList = results
    .filter(r => r.success)
    .map(r => `${r.user}`)
    .join('\n')

  const failedList = results
    .filter(r => !r.success)
    .map(r => `${r.user} - ${r.reason}`)
    .join('\n')

  let description = `**summary:**\nadded: ${successCount}\nfailed: ${failedCount}\n\n`

  if (successList) {
    description += `**successfully added:**\n${successList}\n\n`
  }

  if (failedList) {
    description += `**failed to add:**\n${failedList}`
  }

  embed.setDescription(description)

  const backRow = MinaRows.backRow('ticket:btn:back_manage')

  await interaction.editReply({
    embeds: [embed],
    components: [backRow],
  })
}
