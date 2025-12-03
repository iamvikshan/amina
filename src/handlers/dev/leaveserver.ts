import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaRows } from '@helpers/componentHelper'

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

  const backRow = MinaRows.backRow('dev:btn:back_leaveserver')

  if (!guild) {
    const errorEmbed = MinaEmbed.error()
      .setTitle('error')
      .setDescription(`no server found with id: \`${serverId}\``)

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [backRow],
    })
    return
  }

  const name = guild.name
  try {
    await guild.leave()

    const successEmbed = MinaEmbed.success()
      .setTitle('success')
      .setDescription(`successfully left server: **${name}** (\`${serverId}\`)`)

    await interaction.editReply({
      embeds: [successEmbed],
      components: [backRow],
    })
  } catch (err: any) {
    const errorEmbed = MinaEmbed.error()
      .setTitle('error')
      .setDescription(`failed to leave **${name}**: ${err.message}`)

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [backRow],
    })
  }
}
