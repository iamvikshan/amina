import type { BotClient } from '@src/structures'
import { getSettings } from '@schemas/Guild'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Check for pending guild setup reminders
 * This replaces the memory-leaking setTimeout approach
 * @param client - The bot client instance
 */
export async function checkGuildReminders(client: BotClient): Promise<void> {
  // Look for guilds that joined ~24 hours ago (between 23.5 and 24.5 hours ago)
  // We check a window to handle execution delays and avoid spamming
  const now = Date.now()
  const ONE_DAY = 24 * 60 * 60 * 1000

  // Loop through all cached guilds
  for (const guild of client.guilds.cache.values()) {
    try {
      const settings = await getSettings(guild)

      // Skip if setup is already completed or if reminder was already sent
      if (
        settings.server.setup_completed ||
        settings.server.did_setup_reminder
      ) {
        continue
      }

      // Check if the guild joined approximately 24 hours ago
      // We use the database joinedAt if available, otherwise fallback to guild.joinedTimestamp
      // Ideally we should store joinedAt in DB on join, but for now we use what we have
      const joinedAt = guild.joinedTimestamp

      if (!joinedAt) continue

      const timeSinceJoin = now - joinedAt

      // Check if it's been roughly 24 hours (allow some buffer, e.g., 24h to 25h)
      // We also want to catch any that we missed due to downtime, so we check > 24h
      // But we don't want to remind ancient guilds, so let's cap it at 48h
      if (timeSinceJoin >= ONE_DAY && timeSinceJoin < ONE_DAY * 2) {
        // Mark as reminded immediately to prevent double sending in race conditions
        settings.server.did_setup_reminder = true
        await settings.save()

        client.logger.log(
          `Sending setup reminder to guild: ${guild.name} (${guild.id})`
        )

        try {
          const owner = await guild.members.fetch(guild.ownerId)
          if (owner) {
            const reminderEmbed = MinaEmbed.primary()
              .setTitle('friendly reminder from mina')
              .setDescription(
                `heyyy! just your friendly neighborhood mina here!\n\n` +
                  `i noticed we haven't finished setting things up yet! pretty please run \`/settings\` when you can - i have so many cool features i want to show you!\n\n` +
                  `can't wait to show you what i can really do!`
              )
              .setFooter({
                text: "let's make your server amazing together!",
              })

            await owner.send({ embeds: [reminderEmbed] })
            client.logger.success(
              `Sent setup reminder to owner of ${guild.name}`
            )
          }
        } catch (err: any) {
          client.logger.error(
            `Failed to send reminder DM for guild ${guild.id}: ${err.message}`
          )
        }
      }
    } catch (error: any) {
      client.logger.error(
        `Error checking reminders for guild ${guild.id}: ${error.message}`
      )
    }
  }
}
