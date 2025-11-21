import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show leave server modal
 */
export async function showLeaveServerModal(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('dev:modal:leaveserver')
    .setTitle('Leave Server')

  const serverIdInput = new TextInputBuilder()
    .setCustomId('server_id')
    .setLabel('Server ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter the ID of the server to leave')
    .setRequired(true)
    .setMaxLength(20)

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(
    serverIdInput
  )
  modal.addComponents([row])

  await interaction.showModal(modal)
}

/**
 * Handle leave server modal submission
 */
export async function handleLeaveServerModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const serverId = interaction.fields.getTextInputValue('server_id')
  const guild = interaction.client.guilds.cache.get(serverId)

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_leaveserver',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  if (!guild) {
    const errorEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setTitle('❌ Error')
      .setDescription(`No server found with ID: \`${serverId}\``)

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [backButton],
    })
    return
  }

  const name = guild.name
  try {
    await guild.leave()

    const successEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setTitle('✅ Success')
      .setDescription(`Successfully left server: **${name}** (\`${serverId}\`)`)

    await interaction.editReply({
      embeds: [successEmbed],
      components: [backButton],
    })
  } catch (err: any) {
    const errorEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setTitle('❌ Error')
      .setDescription(`Failed to leave **${name}**: ${err.message}`)

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [backButton],
    })
  }
}
