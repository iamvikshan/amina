import type { TextChannel } from 'discord.js'

export default async function setChannel(
  targetChannel: TextChannel | null,
  settings: any
): Promise<string> {
  if (!targetChannel && !settings.logs_channel) {
    return 'Oh no! It seems like moderation logs are already disabled!'
  }

  if (
    targetChannel &&
    !targetChannel
      .permissionsFor(targetChannel.guild.members.me as any)
      ?.has(['SendMessages', 'EmbedLinks'])
  ) {
    return "Ugh! I can't send logs to that channel! I need the `Send Messages` and `Embed Links` permissions there!"
  }

  settings.logs_channel = targetChannel?.id || null

  // Enable all logs when a channel is set
  if (targetChannel) {
    if (!settings.logs) settings.logs = {}
    settings.logs.enabled = true
    settings.logs.member = {
      message_edit: true,
      message_delete: true,
      role_changes: true,
    }
    settings.logs.channel = {
      create: true,
      edit: true,
      delete: true,
    }
    settings.logs.role = {
      create: true,
      edit: true,
      delete: true,
    }
    if (!settings.automod) settings.automod = {}
    settings.automod.anti_ghostping = true
  } else {
    // Disable all logs when channel is removed
    if (settings.logs) settings.logs.enabled = false
  }

  await settings.save()
  return `Yay! Configuration saved! Logschannel ${targetChannel ? 'updated' : 'removed'} successfully! ${targetChannel ? 'All logs have been enabled.' : ''}`
}
