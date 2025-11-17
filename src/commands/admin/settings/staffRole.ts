import {
  EmbedBuilder,
  ChatInputCommandInteraction,
  Role,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { updateSetupStatus, createSetupEmbed } from './setupEmbed'

export async function addStaffRole(
  interaction: ChatInputCommandInteraction,
  role: Role,
  settings: any
): Promise<void> {
  if (settings.server.staff_roles.includes(role.id)) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(
        `Oops! ${role.toString()} is already a staff role. You can't add it twice!`
      )
    await interaction.editReply({ embeds: [embed] })
    return
  }

  if (settings.server.staff_roles.length >= 5) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(
        'Whoa there! You already have 5 staff roles. Please remove one before adding another.'
      )
    await interaction.editReply({ embeds: [embed] })
    return
  }

  settings.server.staff_roles.push(role.id)
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
}

export async function removeStaffRole(
  interaction: ChatInputCommandInteraction,
  role: Role,
  settings: any
): Promise<void> {
  if (!settings.server.staff_roles.includes(role.id)) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(
        `Hmm... ${role.toString()} is not a staff role. Are you sure you selected the right role?`
      )
    await interaction.editReply({ embeds: [embed] })
    return
  }

  settings.server.staff_roles = settings.server.staff_roles.filter(
    (r: string) => r !== role.id
  )
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
}

export default 0
