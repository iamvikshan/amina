import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import type { BotClient } from '@src/structures'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show list of servers with pagination
 */
export async function showListservers(
  interaction: StringSelectMenuInteraction | ButtonInteraction,
  page: number = 1
): Promise<void> {
  const client = interaction.client as BotClient
  const servers = Array.from(client.guilds.cache.values())
  const total = servers.length
  const maxPerPage = 10
  const totalPages = Math.ceil(total / maxPerPage)

  if (totalPages === 0) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setDescription('No servers found')

    await interaction.editReply({
      embeds: [embed],
      components: [
        createSecondaryBtn({
          customId: 'dev:btn:back_listservers',
          label: 'Back to Dev Hub',
          emoji: '◀️',
        }),
      ],
    })
    return
  }

  // Ensure page is within bounds
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const start = (currentPage - 1) * maxPerPage
  const end = start + maxPerPage < total ? start + maxPerPage : total

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: 'List of servers' })
    .setFooter({
      text: `Total Servers: ${total} • Page ${currentPage} of ${totalPages}`,
    })

  const fields = []
  for (let i = start; i < end; i++) {
    const server = servers[i]
    fields.push({
      name: server.name,
      value: `ID: ${server.id}\nMembers: ${server.memberCount}`,
      inline: true,
    })
  }
  embed.addFields(fields)

  // Build pagination buttons with state in custom_id
  const paginationRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`dev:btn:listservers_page|${currentPage - 1}`)
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 1),
    new ButtonBuilder()
      .setCustomId(`dev:btn:listservers_page|${currentPage + 1}`)
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === totalPages)
  )

  const backRow = createSecondaryBtn({
    customId: 'dev:btn:back_listservers',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [paginationRow, backRow],
  })
}

/**
 * Handle pagination button click
 */
export async function handleListserversPage(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const customId = interaction.customId
  const page = parseInt(customId.split('|')[1], 10)

  await showListservers(interaction, page)
}
