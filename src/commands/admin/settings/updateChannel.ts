import {
  EmbedBuilder,
  ChatInputCommandInteraction,
  TextChannel,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { updateSetupStatus, createSetupEmbed } from './setupEmbed'

export default async function updateChannel(
  interaction: ChatInputCommandInteraction,
  channel: TextChannel,
  settings: any
): Promise<void> {
  if (
    !channel
      .permissionsFor(interaction.guild?.members.me as any)
      ?.has(PermissionFlagsBits.SendMessages)
  ) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(
        "Oopsie! I don't have permission to send messages in that channel. Can you please give me the right permissions? Pretty please?"
      )
    await interaction.editReply({ embeds: [embed] })
    return
  }

  settings.server.updates_channel = channel.id
  await updateSetupStatus(settings)
  await settings.save()

  const setupEmbed = createSetupEmbed(settings)

  const backButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('admin:btn:back')
      .setLabel('Back to Admin Hub')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('◀️')
  )

  await interaction.editReply({
    embeds: [setupEmbed],
    components: [backButton],
  })

  const notificationEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(
      `Yay! This channel has been set as the updates channel for Mina! All my future updates will be sent here. Get ready for some awesome notifications!`
    )
  await channel.send({ embeds: [notificationEmbed] })
}
