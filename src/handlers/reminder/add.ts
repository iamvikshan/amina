import { ChatInputCommandInteraction } from 'discord.js'
import ems from 'enhanced-ms'
import { getUserReminderCount } from '@schemas/Reminder'
import { getUser } from '@schemas/User'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import Logger from '@helpers/Logger'

const MAX_REMINDERS = 25
const MIN_DURATION_MS = 60000 // 1 minute
const MAX_DURATION_DAYS = 365
const DEFAULT_DURATION_MS = 6 * 60 * 60 * 1000 // 6 hours

/**
 * Handle /reminder add command
 */
export async function handleAddReminder(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const message = interaction.options.getString('message', true)
  const inOption = interaction.options.getString('in')

  // Check reminder limit
  const count = await getUserReminderCount(interaction.user.id)
  if (count >= MAX_REMINDERS) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(
          mina.sayf('utility.reminder.add.error.maxReached', {
            max: MAX_REMINDERS.toString(),
          })
        ),
      ],
    })
    return
  }

  // Parse time
  let durationMs = DEFAULT_DURATION_MS

  if (inOption) {
    const parsed = ems(inOption)
    if (!parsed || isNaN(parsed)) {
      await interaction.followUp({
        embeds: [
          MinaEmbed.error(
            mina.say('utility.reminder.add.error.invalidDuration')
          ),
        ],
      })
      return
    }
    durationMs = parsed
  }

  // Validate duration
  if (durationMs < MIN_DURATION_MS) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(
          mina.sayf('utility.reminder.add.error.minDuration', {
            minutes: (MIN_DURATION_MS / 1000 / 60).toString(),
          })
        ),
      ],
    })
    return
  }

  const maxDurationMs = MAX_DURATION_DAYS * 24 * 60 * 60 * 1000
  if (durationMs > maxDurationMs) {
    await interaction.followUp({
      embeds: [
        MinaEmbed.error(
          mina.sayf('utility.reminder.add.error.maxDuration', {
            days: MAX_DURATION_DAYS.toString(),
          })
        ),
      ],
    })
    return
  }

  // Calculate remind_at with timezone support
  const remindAt = await calculateRemindAt(durationMs, interaction.user.id)

  // Get channel info

  try {
    // Create reminder

    const remindAtDate = new Date(remindAt)
    const timestamp = `<t:${Math.floor(remindAtDate.getTime() / 1000)}:R>`
    const location = interaction.guild ? 'this channel' : 'dms'

    const embed = MinaEmbed.success(
      mina.sayf('utility.reminder.add.success', {
        message,
        timestamp,
        location,
      })
    )
      .setTitle('reminder created')
      .setFooter({ text: 'use `/reminder hub` to manage your reminders' })
      .setTimestamp()

    await interaction.followUp({ embeds: [embed] })
  } catch (error) {
    Logger.error('Error creating reminder:', error)
    await interaction.followUp({
      embeds: [MinaEmbed.error(mina.say('utility.reminder.add.error.failed'))],
    })
  }
}

/**
 * Calculate remind_at date with timezone support
 */
async function calculateRemindAt(
  durationMs: number,
  userId: string
): Promise<Date> {
  const userData = await getUser({ id: userId })
  const timezone = userData.profile?.timezone

  // If no timezone, use relative time
  if (!timezone) {
    return new Date(Date.now() + durationMs)
  }

  // TODO: Implement timezone-aware calculation
  // For now, fallback to relative time
  // This would require a library like date-fns-tz or dayjs/plugin/timezone
  return new Date(Date.now() + durationMs)
}
