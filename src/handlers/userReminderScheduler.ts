import type { BotClient } from '@src/structures'
import { getDueReminders, markReminderNotified } from '@schemas/Reminder'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import Logger from '@helpers/Logger'

/**
 * Check for due reminders and send notifications
 * This runs periodically to check for reminders that need to be sent
 * @param client - The bot client instance
 */
export async function checkUserReminders(client: BotClient): Promise<void> {
  try {
    const dueReminders = await getDueReminders()

    if (dueReminders.length === 0) {
      return
    }

    client.logger.log(
      `Checking ${dueReminders.length} due reminder${dueReminders.length === 1 ? '' : 's'}...`
    )

    for (const reminder of dueReminders) {
      try {
        // Try to send notification
        const sent = await sendReminderNotification(client, reminder)

        if (sent) {
          // Mark as notified
          await markReminderNotified(reminder.user_id, reminder.reminder_id)
          client.logger.success(
            `Sent reminder #${reminder.reminder_id} to user ${reminder.user_id}`
          )
        } else {
          // Failed to send, but mark as notified to prevent retry spam
          // User might have DMs disabled or left server
          await markReminderNotified(reminder.user_id, reminder.reminder_id)
          client.logger.warn(
            `Failed to send reminder #${reminder.reminder_id} to user ${reminder.user_id} (marked as notified)`
          )
        }
      } catch (error: any) {
        client.logger.error(
          `Error processing reminder #${reminder.reminder_id}: ${error.message}`
        )
        // Mark as notified to prevent infinite retries
        try {
          await markReminderNotified(reminder.user_id, reminder.reminder_id)
        } catch (_markError) {
          // Ignore mark errors
        }
      }
    }
  } catch (error: any) {
    client.logger.error(
      `Error checking user reminders: ${error.message}`,
      error
    )
  }
}

/**
 * Send reminder notification to user
 * Tries channel first, falls back to DM
 */
async function sendReminderNotification(
  client: BotClient,
  reminder: any
): Promise<boolean> {
  try {
    const user = await client.users.fetch(reminder.user_id)
    if (!user) {
      return false
    }

    const createdAt = Math.floor(new Date(reminder.created_at).getTime() / 1000)

    const embed = MinaEmbed.info(reminder.message)
      .setTitle(mina.say('utility.reminder.notification.title'))
      .setFooter({
        text: mina.sayf('utility.reminder.notification.footer', {
          createdAt: createdAt.toString(),
        }),
      })
      .setTimestamp()

    // Try to send in the original channel first
    if (reminder.guild_id && reminder.channel_id) {
      try {
        const guild = await client.guilds.fetch(reminder.guild_id)
        if (guild) {
          const channel = await guild.channels.fetch(reminder.channel_id)
          if (channel && channel.isTextBased()) {
            // Check if user is still in the guild
            const member = await guild.members
              .fetch(reminder.user_id)
              .catch(() => null)
            if (member) {
              await channel.send({
                content: `${user.toString()}, ${mina.say('utility.reminder.notification.content')}`,
                embeds: [embed],
              })
              return true
            }
          }
        }
      } catch (_channelError) {
        // Channel might be deleted or inaccessible, try DM
        Logger.debug(
          `Channel ${reminder.channel_id} not accessible, trying DM for reminder #${reminder.reminder_id}`
        )
      }
    }

    // Fallback to DM
    try {
      await user.send({
        content: mina.say('utility.reminder.notification.content'),
        embeds: [embed],
      })
      return true
    } catch (dmError: any) {
      // User has DMs disabled
      Logger.debug(
        `Could not DM user ${reminder.user_id} for reminder #${reminder.reminder_id}: ${dmError.message}`
      )
      return false
    }
  } catch (error: any) {
    Logger.error(`Error sending reminder notification: ${error.message}`, error)
    return false
  }
}
