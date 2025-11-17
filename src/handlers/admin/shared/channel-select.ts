import { ChannelSelectMenuInteraction, EmbedBuilder } from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getSettings, updateSettings } from '@schemas/Guild'
import { createSecondaryBtn } from '@helpers/componentHelper'
import updateChannel from '@commands/admin/settings/updateChannel'
import setChannel from '@commands/admin/logs/setChannel'

/**
 * Handle channel selection for updates channel, freewill, and log channel
 */
export async function handleChannelSelect(
  interaction: ChannelSelectMenuInteraction
): Promise<void> {
  const [, , action] = interaction.customId.split(':')
  const channel = interaction.channels.first()

  if (!channel) {
    await interaction.reply({
      content: '❌ No channel selected',
      ephemeral: true,
    })
    return
  }

  await interaction.deferUpdate()

  const settings = await getSettings(interaction.guild)

  switch (action) {
    case 'updateschannel':
      await updateChannel(interaction as any, channel as any, settings)
      break
    case 'freewill': {
      await updateSettings(interaction.guild!.id, {
        aiResponder: {
          ...settings.aiResponder,
          freeWillChannelId: channel.id,
          mentionOnly: false,
          updatedBy: interaction.user.id,
          updatedAt: new Date(),
        },
      })

      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setDescription(
          `🌊 Free-will channel set to ${channel}!\n\n` +
            `I'll respond to all messages there without needing @mentions! ✨`
        )
      await interaction.editReply({
        embeds: [embed],
        components: [
          createSecondaryBtn({
            customId: 'admin:btn:back',
            label: 'Back to Admin Hub',
            emoji: '◀️',
          }),
        ],
      })
      break
    }
    case 'logchannel': {
      const result = await setChannel(channel as any, settings)
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setDescription(result)
      await interaction.editReply({
        embeds: [embed],
        components: [
          createSecondaryBtn({
            customId: 'admin:btn:back',
            label: 'Back to Admin Hub',
            emoji: '◀️',
          }),
        ],
      })
      break
    }
  }
}
