import {
  StringSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  TextChannel,
  MessageFlags,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'
import { getSettings, updateSettings } from '@schemas/Guild'

/**
 * Show channel select for log channel setup
 */
export async function showLogChannelSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: '📝 Setup Log Channel' })
    .setDescription(
      'Please select the channel where ticket logs should be sent.\n\n' +
        'This channel will receive logs when tickets are closed, including transcripts.'
    )
    .setFooter({ text: 'Select a text channel below' })

  const channelSelect =
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('ticket:channel:log')
        .setPlaceholder('📝 Select a log channel...')
        .setChannelTypes(ChannelType.GuildText)
    )

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back_setup',
    label: 'Back to Setup',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [channelSelect, backButton],
  })
}

/**
 * Handle log channel selection
 */
export async function handleLogChannelSelect(
  interaction: ChannelSelectMenuInteraction
): Promise<void> {
  const channel = interaction.channels.first() as TextChannel

  if (!channel) {
    await interaction.reply({
      content: '❌ Invalid channel selected',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  // Check bot permissions
  if (
    !channel
      .permissionsFor(interaction.guild!.members.me!)
      ?.has(['SendMessages', 'EmbedLinks'])
  ) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            `Oops! I don't have permission to send messages and embeds in ${channel}. Could you please give me those permissions? Pretty please? 🙏`
          ),
      ],
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  await interaction.deferUpdate()

  // Update settings
  const settings = await getSettings(interaction.guild!)
  settings.ticket.log_channel = channel.id
  await updateSettings(interaction.guild!.id, settings)

  const successEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(
      `Configuration saved! Ticket logs will be sent to ${channel.toString()} 🎉\n\n` +
        'All ticket closures will now be logged in this channel.'
    )

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back_setup',
    label: 'Back to Setup',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [successEmbed],
    components: [backButton],
  })
}
