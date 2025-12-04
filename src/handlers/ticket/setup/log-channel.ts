import {
  StringSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  TextChannel,
  MessageFlags,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaRows } from '@helpers/componentHelper'
import { getSettings, updateSettings } from '@schemas/Guild'

/**
 * Show channel select for log channel setup
 */
export async function showLogChannelSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const embed = MinaEmbed.primary()
    .setAuthor({ name: 'setup log channel' })
    .setDescription(
      'please select the channel where ticket logs should be sent.\n\n' +
        'this channel will receive logs when tickets are closed, including transcripts.'
    )
    .setFooter({ text: 'select a text channel below' })

  const channelSelect =
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('ticket:channel:log')
        .setPlaceholder('select a log channel...')
        .setChannelTypes(ChannelType.GuildText)
    )

  const backRow = MinaRows.backRow('ticket:btn:back_setup')

  await interaction.editReply({
    embeds: [embed],
    components: [channelSelect, backRow],
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
      content: 'invalid channel selected',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  // Ensure guild is available and check bot permissions
  if (!interaction.guild) return
  const guild = interaction.guild
  const botMember = guild.members.me
  if (
    !botMember ||
    !channel.permissionsFor(botMember)?.has(['SendMessages', 'EmbedLinks'])
  ) {
    await interaction.reply({
      embeds: [
        MinaEmbed.error(
          `i don't have permission to send messages and embeds in ${channel}. please give me those permissions.`
        ),
      ],
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  await interaction.deferUpdate()

  // Update settings
  const settings = await getSettings(guild)
  settings.ticket.log_channel = channel.id
  await updateSettings(guild.id, settings)

  const successEmbed = MinaEmbed.success(
    `configuration saved. ticket logs will be sent to ${channel.toString()}.\n\n` +
      'all ticket closures will now be logged in this channel.'
  )

  const backRow = MinaRows.backRow('ticket:btn:back_setup')

  await interaction.editReply({
    embeds: [successEmbed],
    components: [backRow],
  })
}
