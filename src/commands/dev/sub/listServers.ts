import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js'
import type { BotClient } from '@structures/BotClient'
import type { ChatInputCommandInteraction } from 'discord.js'

export default async function listservers(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const { client, member } = interaction
  const matched: any[] = []
  const match = interaction.options.getString('match') || null

  // Match by ID or name
  if (match) {
    if (client.guilds.cache.has(match)) {
      matched.push(client.guilds.cache.get(match))
    }
    client.guilds.cache
      .filter(g => g.name.toLowerCase().includes(match.toLowerCase()))
      .forEach(g => matched.push(g))
  }

  const servers = match ? matched : Array.from(client.guilds.cache.values())
  const total = servers.length
  const maxPerPage = 10
  const totalPages = Math.ceil(total / maxPerPage)

  if (totalPages === 0) {
    await interaction.followUp('No servers found')
    return
  }

  let currentPage = 1

  // Embed Builder
  const buildEmbed = () => {
    const start = (currentPage - 1) * maxPerPage
    const end = start + maxPerPage < total ? start + maxPerPage : total

    const embed = new EmbedBuilder()
      .setColor((client as BotClient).config.EMBED_COLORS.BOT_EMBED)
      .setAuthor({ name: 'List of servers' })
      .setFooter({
        text: `${match ? 'Matched' : 'Total'} Servers: ${total} • Page ${currentPage} of ${totalPages}`,
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

  const embed = buildEmbed()
  const sentMsg = await interaction.followUp({
    embeds: [embed],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('prevBtn')
          .setEmoji('⬅️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('nxtBtn')
          .setEmoji('➡️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(totalPages === 1)
      ),
    ],
  })

  // Listeners for pagination
  const collector = interaction.channel?.createMessageComponentCollector({
    filter: response =>
      response.user.id === (member as any)?.id &&
      response.message.id === sentMsg.id,
    componentType: ComponentType.Button,
  })

  if (!collector) return

  collector.on('collect', async response => {
    await response.deferUpdate()

    if (response.customId === 'prevBtn' && currentPage > 1) {
      currentPage--
      const embed = buildEmbed()
      await response.editReply({ embeds: [embed] })
    }
    if (response.customId === 'nxtBtn' && currentPage < totalPages) {
      currentPage++
      const embed = buildEmbed()
      await response.editReply({ embeds: [embed] })
    }
  })

  collector.on('end', async () => {
    await sentMsg.edit({ components: [] })
  })
}
