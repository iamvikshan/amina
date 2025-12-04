import { StringSelectMenuInteraction, ButtonInteraction } from 'discord.js'
import { deleteAllUserReminders, getUserReminderCount } from '@schemas/Reminder'
import { MinaRows, MinaButtons } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import { showReminderHub } from './main-hub'

/**
 * Show clear all confirmation
 */
export async function showClearConfirmation(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate()
  }

  const count = await getUserReminderCount(interaction.user.id)

  if (count === 0) {
    const embed = MinaEmbed.error(mina.say('utility.reminder.clear.empty'))
    await interaction.editReply({
      embeds: [embed],
      components: [MinaRows.backRow('reminder:btn:back')],
    })
    return
  }

  const embed = MinaEmbed.warning(
    mina.sayf('utility.reminder.clear.description', {
      count: count.toString(),
      plural: count === 1 ? '' : 's',
    })
  )
    .setTitle(mina.say('utility.reminder.clear.title'))
    .setFooter({ text: mina.say('utility.reminder.clear.footer') })

  const confirmRow = MinaRows.from(
    MinaButtons.yeah('reminder:btn:clear_confirm'),
    MinaButtons.nah('reminder:btn:clear_cancel')
  )

  await interaction.editReply({
    embeds: [embed],
    components: [confirmRow],
  })
}

/**
 * Handle clear confirmation
 */
export async function handleClearConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const deleted = await deleteAllUserReminders(interaction.user.id)

  const embed = MinaEmbed.success(
    mina.sayf('utility.reminder.clear.success', {
      count: deleted.toString(),
      plural: deleted === 1 ? '' : 's',
    })
  )
    .setTitle('reminders cleared')
    .withFooter(mina.say('utility.reminder.clear.footerAfterClear'))
    .setTimestamp()

  await interaction.editReply({
    embeds: [embed],
    components: [MinaRows.backRow('reminder:btn:back')],
  })
}

/**
 * Handle clear cancellation
 */
export async function handleClearCancel(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showReminderHub(interaction)
}
