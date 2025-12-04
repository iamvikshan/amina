import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaSelects } from '@helpers/componentHelper'
import { getUserReminders } from '@schemas/Reminder'
import { getUser } from '@schemas/User'
import { mina } from '@helpers/mina'

const MAX_REMINDERS = 25

/**
 * Show main reminder hub with preview
 */
export async function showReminderHub(
  interaction:
    | StringSelectMenuInteraction
    | ButtonInteraction
    | ChatInputCommandInteraction
): Promise<void> {
  const userId = interaction.user.id
  const reminders = await getUserReminders(userId)
  const count = reminders.length

  // Get next reminder
  const nextReminder = reminders.length > 0 ? reminders[0] : null

  // Build description
  let nextReminderText = mina.say('utility.reminder.hub.noReminders')
  if (nextReminder) {
    const remindAt = new Date(nextReminder.remind_at)
    const relativeTime = getRelativeTime(remindAt)
    nextReminderText = mina.sayf('utility.reminder.hub.nextReminder', {
      message: nextReminder.message,
      relativeTime,
    })
  }

  const description = mina.sayf('utility.reminder.hub.description', {
    count: count.toString(),
    max: MAX_REMINDERS.toString(),
    nextReminder: nextReminderText,
  })

  // Check timezone
  const userData = await getUser(interaction.user)
  const hasTimezone = !!userData.profile?.timezone
  const footer = hasTimezone
    ? mina.say('utility.reminder.hub.footerWithTimezone')
    : mina.say('utility.reminder.hub.footerNoTimezone')

  const embed = MinaEmbed.primary()
    .setTitle(mina.say('utility.reminder.hub.title'))
    .setDescription(description)
    .setFooter({ text: footer })
    .withUser({ user: interaction.user })

  const menuOptions = [
    {
      label: 'view reminders',
      description: 'see all your active reminders',
      value: 'view',
    },
  ]

  if (count > 0) {
    menuOptions.push({
      label: 'clear all',
      description: `delete all ${count} reminder${count === 1 ? '' : 's'}`,
      value: 'clear',
    })
  }

  const menu = MinaSelects.string(
    'reminder:menu:operation',
    'select an operation...',
    menuOptions
  )

  await interaction.editReply({
    embeds: [embed],
    components: [MinaSelects.row(menu)],
  })
}

/**
 * Handle operation selection from main hub
 */
export async function handleReminderOperationMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const operation = interaction.values[0]

  await interaction.deferUpdate()

  switch (operation) {
    case 'view':
      const { showRemindersList } = await import('./list')
      await showRemindersList(interaction)
      break
    case 'clear':
      const { showClearConfirmation } = await import('./clear')
      await showClearConfirmation(interaction)
      break
    default:
      await interaction.followUp({
        embeds: [MinaEmbed.error('invalid operation.')],
        ephemeral: true,
      })
  }
}

/**
 * Handle back button to return to main reminder hub
 */
export async function handleReminderBackButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showReminderHub(interaction)
}

// Helper function
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
