import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import type { BotClient } from '@src/structures'
import { createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show list of servers with pagination
 */
export async function showListservers(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

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

  let currentPage = 1

  const buildEmbed = (page: number): EmbedBuilder => {
    const start = (page - 1) * maxPerPage
    const end = start + maxPerPage < total ? start + maxPerPage : total

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setAuthor({ name: 'List of servers' })
      .setFooter({
        text: `Total Servers: ${total} • Page ${page} of ${totalPages}`,
      })

    const fields = []
    for (let i = start; i < end; i++) {
      const server = servers[i]
      fields.push({
        name: server.name,
        value: server.id,
        inline: true,
      })
    }
    embed.addFields(fields)

    return embed
  }

  const buildComponents = (page: number): ActionRowBuilder<ButtonBuilder>[] => {
    const rows: ActionRowBuilder<ButtonBuilder>[] = []

    // Pagination buttons
    const paginationRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('dev:btn:listservers_prev')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 1),
      new ButtonBuilder()
        .setCustomId('dev:btn:listservers_next')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages)
    )

    rows.push(paginationRow)

    // Back button
    const backRow = createSecondaryBtn({
      customId: 'dev:btn:back_listservers',
      label: 'Back to Dev Hub',
      emoji: '◀️',
    })

    rows.push(backRow)

    return rows
  }

  const embed = buildEmbed(currentPage)
  const components = buildComponents(currentPage)

  const message = await interaction.editReply({
    embeds: [embed],
    components,
  })

  // Set up pagination collector
  const collector = message.createMessageComponentCollector({
    filter: response => response.user.id === interaction.user.id,
    componentType: ComponentType.Button,
    time: 300_000, // 5 minutes
  })

  collector.on('collect', async response => {
    await response.deferUpdate()

    if (response.customId === 'dev:btn:listservers_prev' && currentPage > 1) {
      currentPage--
    } else if (
      response.customId === 'dev:btn:listservers_next' &&
      currentPage < totalPages
    ) {
      currentPage++
    } else if (response.customId === 'dev:btn:back_listservers') {
      collector.stop()
      const { showDevHub } = await import('./main-hub')
      await showDevHub(response)
      return
    }

    const newEmbed = buildEmbed(currentPage)
    const newComponents = buildComponents(currentPage)

    await response.editReply({
      embeds: [newEmbed],
      components: newComponents,
    })
  })

  collector.on('end', async () => {
    try {
      await message.edit({ components: [] })
    } catch (error) {
      // Message may have been deleted
    }
  })
}
