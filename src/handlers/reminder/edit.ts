import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js'
import ems from 'enhanced-ms'
import {
  getReminder,
  updateReminderMessage,
  updateReminderTime,
} from '@schemas/Reminder'
import {
  MinaRows,
  MinaSelects,
  parseCustomIdState,
} from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import { showRemindersList } from './list'

const MIN_DURATION_MS = 60000
const MAX_DURATION_DAYS = 365

/**
 * Show edit reminder view
 */
export async function showEditReminder(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  reminderId: number
): Promise<void> {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate()
  }

  const reminder = await getReminder(interaction.user.id, reminderId)

  if (!reminder) {
    await interaction.editReply({
      embeds: [
        MinaEmbed.error(mina.say('utility.reminder.edit.error.notFound')),
      ],
      components: [MinaRows.backRow('reminder:btn:back')],
    })
    return
  }

  const remindAt = new Date(reminder.remind_at)
  const timestamp = `<t:${Math.floor(remindAt.getTime() / 1000)}:R>`

  const embed = MinaEmbed.primary()
    .setTitle(
      mina.sayf('utility.reminder.edit.title', {
        id: reminderId.toString(),
      })
    )
    .setDescription(
      mina.sayf('utility.reminder.edit.description', {
        message: reminder.message,
        timestamp,
      })
    )

  const menu = MinaSelects.string(
    'reminder:menu:edit_action',
    'select what to edit...',
    [
      {
        label: 'edit message',
        description: 'change the reminder message',
        value: `edit_msg_${reminderId}`,
      },
      {
        label: 'edit time',
        description: 'change when to remind',
        value: `edit_time_${reminderId}`,
      },
    ]
  )

  await interaction.editReply({
    embeds: [embed],
    components: [MinaSelects.row(menu), MinaRows.backRow('reminder:btn:back')],
  })
}

/**
 * Handle edit action menu
 */
export async function handleEditActionMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const value = interaction.values[0]
  const [action, reminderIdStr] = value.split('_').slice(-2)
  const reminderId = parseInt(reminderIdStr, 10)

  if (isNaN(reminderId)) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(mina.say('utility.reminder.edit.error.invalidId')),
      ],
      ephemeral: true,
    })
    return
  }

  const reminder = await getReminder(interaction.user.id, reminderId)
  if (!reminder) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(mina.say('utility.reminder.edit.error.notFound')),
      ],
      ephemeral: true,
    })
    return
  }

  if (action === 'msg') {
    // Show modal to edit message
    const messageInput = new TextInputBuilder({
      customId: 'message',
      label: 'reminder message',
      style: TextInputStyle.Paragraph,
      placeholder: 'what should i remind you about?',
      value: reminder.message,
      required: true,
      maxLength: 500,
    })

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
      messageInput
    )

    const modal = new ModalBuilder({
      customId: `reminder:modal:edit_msg|id:${reminderId}`,
      title: 'edit reminder message',
      components: [row],
    })

    await interaction.showModal(modal)
  } else if (action === 'time') {
    // Show modal to edit time
    const remindAt = new Date(reminder.remind_at)
    const now = Date.now()
    const diffMs = remindAt.getTime() - now
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    let currentTimeStr = '6h'
    if (diffHours > 0) {
      currentTimeStr = `${diffHours}h`
      if (diffMinutes > 0) currentTimeStr += ` ${diffMinutes}m`
    } else if (diffMinutes > 0) {
      currentTimeStr = `${diffMinutes}m`
    }

    const durationInput = new TextInputBuilder({
      customId: 'duration',
      label: 'when to remind (e.g., 1h, 2d, 6h)',
      style: TextInputStyle.Short,
      placeholder: '1h / 2d / 6h',
      value: currentTimeStr,
      required: true,
    })

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
      durationInput
    )

    const modal = new ModalBuilder({
      customId: `reminder:modal:edit_time|id:${reminderId}`,
      title: 'edit reminder time',
      components: [row],
    })

    await interaction.showModal(modal)
  }
}

/**
 * Handle edit message modal submit
 */
export async function handleEditMessageModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const { state } = parseCustomIdState(interaction.customId)
  const reminderId = parseInt(state.id, 10)

  if (isNaN(reminderId)) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(mina.say('utility.reminder.edit.error.invalidId')),
      ],
      ephemeral: true,
    })
    return
  }

  const newMessage = interaction.fields.getTextInputValue('message')

  if (!newMessage || newMessage.trim().length === 0) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(mina.say('utility.reminder.edit.error.emptyMessage')),
      ],
      ephemeral: true,
    })
    return
  }

  if (newMessage.length > 500) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(mina.say('utility.reminder.edit.error.tooLong')),
      ],
      ephemeral: true,
    })
    return
  }

  const updated = await updateReminderMessage(
    interaction.user.id,
    reminderId,
    newMessage.trim()
  )

  if (updated) {
    const embed = MinaEmbed.success(
      mina.sayf('utility.reminder.edit.success.message', {
        message: newMessage.trim(),
      })
    ).setTitle('reminder edited')

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
      embeds: [MinaEmbed.error(mina.say('utility.reminder.edit.error.failed'))],
      ephemeral: true,
    })
  }
}

/**
 * Handle edit time modal submit
 */
export async function handleEditTimeModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const { state } = parseCustomIdState(interaction.customId)
  const reminderId = parseInt(state.id, 10)

  if (isNaN(reminderId)) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(mina.say('utility.reminder.edit.error.invalidId')),
      ],
      ephemeral: true,
    })
    return
  }

  const durationStr = interaction.fields.getTextInputValue('duration')
  const durationMs = ems(durationStr)

  if (!durationMs || isNaN(durationMs)) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(
          mina.say('utility.reminder.edit.error.invalidDuration')
        ),
      ],
      ephemeral: true,
    })
    return
  }

  // Validate duration
  if (durationMs < MIN_DURATION_MS) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(
          mina.sayf('utility.reminder.edit.error.minDuration', {
            minutes: (MIN_DURATION_MS / 1000 / 60).toString(),
          })
        ),
      ],
      ephemeral: true,
    })
    return
  }

  const maxDurationMs = MAX_DURATION_DAYS * 24 * 60 * 60 * 1000
  if (durationMs > maxDurationMs) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(
          mina.sayf('utility.reminder.edit.error.maxDuration', {
            days: MAX_DURATION_DAYS.toString(),
          })
        ),
      ],
      ephemeral: true,
    })
    return
  }

  // Calculate new remind_at
  const newRemindAt = new Date(Date.now() + durationMs)

  const updated = await updateReminderTime(
    interaction.user.id,
    reminderId,
    newRemindAt
  )

  if (updated) {
    const timestamp = `<t:${Math.floor(newRemindAt.getTime() / 1000)}:R>`

    const embed = MinaEmbed.success(
      mina.sayf('utility.reminder.edit.success.time', {
        timestamp,
      })
    ).setTitle('reminder edited')

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
      embeds: [MinaEmbed.error(mina.say('utility.reminder.edit.error.failed'))],
      ephemeral: true,
    })
  }
}
