import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
} from 'discord.js'
import { getUserReminders } from '@schemas/Reminder'
import {
  MinaRows,
  MinaButtons,
  parseCustomIdState,
  MinaSelects,
} from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import { showEditReminder } from './edit'

const REMINDERS_PER_PAGE = 5

/**
 * Show paginated list of reminders
 */
export async function showRemindersList(
  interaction:
    | StringSelectMenuInteraction
    | ButtonInteraction
    | ModalSubmitInteraction,
  page: number = 1
): Promise<void> {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate()
  }

  const userId = interaction.user.id
  const reminders = await getUserReminders(userId)

  if (reminders.length === 0) {
    const embed = MinaEmbed.warning(
      mina.say('utility.reminder.list.empty')
    ).setTitle('your reminders')

    await interaction.editReply({
      embeds: [embed],
      components: [MinaRows.backRow('reminder:btn:back')],
    })
    return
  }

  // Calculate pagination
  const totalPages = Math.ceil(reminders.length / REMINDERS_PER_PAGE)
  const startIndex = (page - 1) * REMINDERS_PER_PAGE
  const endIndex = startIndex + REMINDERS_PER_PAGE
  const remindersToShow = reminders.slice(startIndex, endIndex)

  // Build fields
  const fields = remindersToShow.map(reminder => {
    const remindAt = new Date(reminder.remind_at)
    const relativeTime = getRelativeTime(remindAt)
    const timestamp = `<t:${Math.floor(remindAt.getTime() / 1000)}:R>`

    return {
      name: `#${reminder.reminder_id} - ${reminder.message}`,
      value: `${timestamp} (${relativeTime})`,
      inline: false,
    }
  })

  const embed = MinaEmbed.info()
    .setTitle(
      mina.sayf('utility.reminder.list.title', {
        total: reminders.length.toString(),
      })
    )
    .setDescription(
      mina.sayf('utility.reminder.list.description', {
        start: (startIndex + 1).toString(),
        end: Math.min(endIndex, reminders.length).toString(),
        total: reminders.length.toString(),
      })
    )
    .addFields(fields)
    .setFooter({
      text: mina.sayf('utility.reminder.list.footer', {
        page: page.toString(),
        totalPages: totalPages.toString(),
      }),
    })

  // Build components
  const components = []

  // Pagination buttons
  if (totalPages > 1) {
    const navButtons: any[] = []
    if (page > 1) {
      navButtons.push(
        MinaButtons.prev(`reminder:btn:page|page:${page - 1}`, false)
      )
    }
    if (page < totalPages) {
      navButtons.push(
        MinaButtons.next(`reminder:btn:page|page:${page + 1}`, false)
      )
    }
    if (navButtons.length > 0) {
      components.push(MinaRows.from(...navButtons))
    }
  }

  // Delete menu
  const deleteOptions = remindersToShow.map(reminder => ({
    label: `#${reminder.reminder_id} - ${truncate(reminder.message, 50)}`,
    description: 'delete this reminder',
    value: `delete_${reminder.reminder_id}`,
  }))

  if (deleteOptions.length > 0) {
    components.push(
      MinaSelects.row(
        MinaSelects.string(
          'reminder:menu:delete',
          'select a reminder to delete...',
          deleteOptions
        )
      )
    )
  }

  // Edit menu
  const editOptions = remindersToShow.map(reminder => ({
    label: `#${reminder.reminder_id} - ${truncate(reminder.message, 50)}`,
    description: 'edit this reminder',
    value: `edit_${reminder.reminder_id}`,
  }))

  if (editOptions.length > 0) {
    components.push(
      MinaSelects.row(
        MinaSelects.string(
          'reminder:menu:edit',
          'select a reminder to edit...',
          editOptions
        )
      )
    )
  }

  components.push(MinaRows.backRow('reminder:btn:back'))

  await interaction.editReply({
    embeds: [embed],
    components,
  })
}

/**
 * Handle pagination button
 */
export async function handleReminderPage(
  interaction: ButtonInteraction
): Promise<void> {
  const { state } = parseCustomIdState(interaction.customId)
  const page = state.page ? parseInt(state.page, 10) : 1
  await showRemindersList(interaction, page)
}

/**
 * Handle delete reminder menu
 */
export async function handleDeleteReminderMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const value = interaction.values[0]
  const reminderId = parseInt(value.replace('delete_', ''), 10)

  if (isNaN(reminderId)) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(mina.say('utility.reminder.delete.error.invalidId')),
      ],
      ephemeral: true,
    })
    return
  }

  const { deleteReminder } = await import('@schemas/Reminder')
  const deleted = await deleteReminder(interaction.user.id, reminderId)

  if (deleted) {
    const embed = MinaEmbed.success(
      mina.sayf('utility.reminder.delete.success', {
        id: reminderId.toString(),
      })
    ).setTitle('reminder deleted')

    await interaction.editReply({
      embeds: [embed],
      components: [MinaRows.backRow('reminder:btn:back')],
    })

    // Refresh list after a short delay
    setTimeout(async () => {
      try {
        await showRemindersList(interaction, 1)
      } catch (_error) {
        // User may have navigated away
      }
    }, 1500)
  } else {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(mina.say('utility.reminder.delete.error.notFound')),
      ],
      ephemeral: true,
    })
  }
}

/**
 * Handle edit reminder menu
 */
export async function handleEditReminderMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const value = interaction.values[0]
  const reminderId = parseInt(value.replace('edit_', ''), 10)

  if (isNaN(reminderId)) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(mina.say('utility.reminder.edit.error.invalidId')),
      ],
      ephemeral: true,
    })
    return
  }

  await showEditReminder(interaction, reminderId)
}

// Helper functions
function getRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = date.getTime() - now

  if (diff < 0) return 'overdue'

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)

  if (weeks > 0) return `in ${weeks}w`
  if (days > 0) return `in ${days}d`
  if (hours > 0) return `in ${hours}h`
  if (minutes > 0) return `in ${minutes}m`
  return 'soon'
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}
