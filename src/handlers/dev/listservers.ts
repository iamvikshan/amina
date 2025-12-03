import { StringSelectMenuInteraction, ButtonInteraction } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import type { BotClient } from '@src/structures'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

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
    const embed = MinaEmbed.primary().setDescription(
      mina.say('dev.listservers.empty')
    )

    await interaction.editReply({
      embeds: [embed],
      components: [MinaRows.backRow('dev:btn:back_listservers')],
    })
    return
  }

  // Ensure page is within bounds
  const currentPage = Math.max(1, Math.min(page, totalPages))
  const start = (currentPage - 1) * maxPerPage
  const end = start + maxPerPage < total ? start + maxPerPage : total

  const embed = MinaEmbed.primary()
    .setAuthor({ name: mina.say('dev.listservers.title') })
    .setFooter({
      text: mina.sayf('dev.listservers.footer', {
        total: total.toString(),
        page: currentPage.toString(),
        totalPages: totalPages.toString(),
      }),
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
  const paginationRow = MinaRows.from(
    MinaButtons.prev(
      `dev:btn:listservers_page|${currentPage - 1}`,
      currentPage === 1
    ),
    MinaButtons.next(
      `dev:btn:listservers_page|${currentPage + 1}`,
      currentPage === totalPages
    )
  )

  const backRow = MinaRows.backRow('dev:btn:back_listservers')

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
