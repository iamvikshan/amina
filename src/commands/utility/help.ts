import CommandCategory from '@src/structures/CommandCategory'
import config from '@src/config'
import { Logger } from '@helpers/Logger'
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  Message,
  GuildMember,
  StringSelectMenuOptionBuilder,
  StringSelectMenuInteraction,
  Collection,
  Client,
} from 'discord.js'
import { getSlashUsage } from '@handlers/command'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaRows } from '@helpers/componentHelper'

interface BotClient extends Client {
  slashCommands: Collection<string, CommandData>
  getInvite: () => string
}

const CMDS_PER_PAGE = 5
const IDLE_TIMEOUT = 900 // 15 minutes

const command: CommandData = {
  name: 'help',
  description: 'browse available commands by category or get command details',
  category: 'UTILITY',
  cooldown: 5,
  botPermissions: ['EmbedLinks'],
  command: {
    enabled: false,
  },
  slashCommand: {
    enabled: true,
    ephemeral: false,
    options: [
      {
        name: 'command',
        description: 'name of the command',
        required: false,
        type: ApplicationCommandOptionType.String,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const cmdName = interaction.options.getString('command')

    // !help
    if (!cmdName) {
      const response = await getHelpMenu(interaction)
      const sentMsg = await interaction.editReply(response)
      return waiter(sentMsg, interaction.member as GuildMember)
    }

    // check if command help (!help cat)
    const client = interaction.client as BotClient
    const cmd = client.slashCommands.get(cmdName)
    if (cmd) {
      const embed = getSlashUsage(cmd)
      return interaction.editReply({ embeds: [embed] })
    }

    // No matching command/category found
    await interaction.editReply('no command matches that.')
  },
}

async function getHelpMenu(interaction: ChatInputCommandInteraction) {
  const { client, guild, member } = interaction
  const botClient = client as BotClient

  // Menu Row
  const options: StringSelectMenuOptionBuilder[] = []
  for (const [k, v] of Object.entries(CommandCategory)) {
    if ((v as any).enabled === false) continue

    const guildMember = member as GuildMember

    if (
      (v.name.includes('Moderation') ||
        v.name.includes('Admin') ||
        v.name.includes('Automod') ||
        v.name.includes('Ticket') ||
        v.name.includes('Giveaway')) &&
      !guildMember.permissions.has('ManageGuild')
    ) {
      continue
    }
    if (
      v.name === 'Developer' &&
      !config.BOT.DEV_IDS.includes(guildMember.user.id)
    )
      continue

    options.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(v.name)
        .setValue(k)
        .setDescription(`View commands in ${v.name} category`)
        .setEmoji(v.emoji)
    )
  }

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help-menu')
      .setPlaceholder('choose the command category')
      .addOptions(options)
  )

  // Buttons Row - initially disabled (no category selected yet)
  const buttonsRow = MinaRows.pagination(0, 1, {
    prev: 'previousBtn',
    next: 'nextBtn',
  })

  // intentional hardcoded responses
  const botName = guild?.members.me?.displayName || 'mina'
  const embed = MinaEmbed.primary()
    .setAuthor({ name: `${botName} Help Menu` })
    .setThumbnail(botClient.user?.displayAvatarURL() || null)
    .setDescription(
      `hey. i'm ${botName}.\n` +
        'a multipurpose discord bot with moderation, fun, economy, music, and more.\n' +
        'i can also talk, execute commands, and so much more using natural language conversation\n\n' +
        `[invite me](${botClient.getInvite()})\n` +
        `[support server](${config.BOT.SUPPORT_SERVER ?? ''})`
    )

  return {
    embeds: [embed],
    components: [menuRow, buttonsRow],
  }
}

const waiter = (msg: Message, member: GuildMember) => {
  const collector = msg.channel.createMessageComponentCollector({
    filter: reactor =>
      reactor.user.id === member.id && msg.id === reactor.message.id,
    idle: IDLE_TIMEOUT * 1000,
    time: 5 * 60 * 1000,
  })

  let arrEmbeds: MinaEmbed[] = []
  let currentPage = 0
  let menuRow = msg.components[0]
  let buttonsRow: any = msg.components[1]

  collector.on('collect', async response => {
    try {
      if (!['help-menu', 'previousBtn', 'nextBtn'].includes(response.customId))
        return

      // Defer the update first
      if (!response.deferred && !response.replied) {
        await response.deferUpdate()
      }

      switch (response.customId) {
        case 'help-menu': {
          const selectResponse = response as StringSelectMenuInteraction
          const cat = selectResponse.values[0].toUpperCase()
          const client = msg.client as BotClient
          arrEmbeds = getSlashCategoryEmbeds(client, cat, member)
          currentPage = 0

          // Buttons Row - use pagination helper
          buttonsRow = MinaRows.pagination(currentPage, arrEmbeds.length, {
            prev: 'previousBtn',
            next: 'nextBtn',
          })
          // Use response.editReply instead of msg.edit
          await response.editReply({
            embeds: [arrEmbeds[currentPage]],
            components: [menuRow, buttonsRow],
          })
          break
        }

        case 'previousBtn':
          if (currentPage !== 0) {
            --currentPage
            // Update buttons based on new page
            buttonsRow = MinaRows.pagination(currentPage, arrEmbeds.length, {
              prev: 'previousBtn',
              next: 'nextBtn',
            })
            // Use response.editReply instead of msg.edit
            await response.editReply({
              embeds: [arrEmbeds[currentPage]],
              components: [menuRow, buttonsRow],
            })
          }
          break

        case 'nextBtn':
          if (currentPage < arrEmbeds.length - 1) {
            currentPage++
            // Update buttons based on new page
            buttonsRow = MinaRows.pagination(currentPage, arrEmbeds.length, {
              prev: 'previousBtn',
              next: 'nextBtn',
            })
            // Use response.editReply instead of msg.edit
            await response.editReply({
              embeds: [arrEmbeds[currentPage]],
              components: [menuRow, buttonsRow],
            })
          }
          break
      }
    } catch (error) {
      // Log the error but don't crash
      Logger.error('Error handling help menu interaction', error)
    }
  })

  collector.on('end', () => {
    if (!msg.guild || !msg.channel) return
    if (msg.editable) {
      msg.edit({ components: [] }).catch(() => {})
    }
  })
}

function getSlashCategoryEmbeds(
  client: BotClient,
  category: string,
  member: GuildMember
): MinaEmbed[] {
  let collector = ''

  // For IMAGE Category
  if (category === 'IMAGE') {
    client.slashCommands
      .filter(cmd => cmd.category === category)
      .forEach(
        cmd => (collector += `\`/${cmd.name}\`\n ❯ ${cmd.description}\n\n`)
      )

    const filterCmd = client.slashCommands.get('filter')
    const genCmd = client.slashCommands.get('generator')

    const availableFilters = filterCmd?.slashCommand.options?.[0]
      ? (filterCmd.slashCommand.options[0] as any).choices
          ?.map((ch: any) => ch.name)
          .join(', ')
      : ''

    const availableGens = genCmd?.slashCommand.options?.[0]
      ? (genCmd.slashCommand.options[0] as any).choices
          ?.map((ch: any) => ch.name)
          .join(', ')
      : ''

    collector +=
      '**Available Filters:**\n' +
      `${availableFilters}` +
      `\n\n**Available Generators**\n` +
      `${availableGens}`

    const embed = MinaEmbed.primary()
      .setThumbnail((CommandCategory as any)[category]?.image)
      .setAuthor({ name: `${category} commands` })
      .setDescription(collector)

    return [embed]
  }

  // For REMAINING Categories
  const commands = Array.from(
    client.slashCommands.filter(cmd => cmd.category === category).values()
  )

  if (commands.length === 0) {
    const embed = MinaEmbed.primary()
      .setThumbnail((CommandCategory as any)[category]?.image)
      .setAuthor({ name: `${category} commands` })
      .setDescription('no commands in this category')

    return [embed]
  }

  const arrSplitted: string[][] = []
  const arrEmbeds: MinaEmbed[] = []

  while (commands.length) {
    let toAdd = commands.splice(
      0,
      commands.length > CMDS_PER_PAGE ? CMDS_PER_PAGE : commands.length
    )

    const mapped = toAdd
      .map(cmd => {
        // Check if the user has the required permissions for the command
        if (
          cmd.userPermissions?.some(
            (perm: any) => !member.permissions.has(perm)
          )
        ) {
          return null
        }

        return `\`/${cmd.name}\`\n ❯ **description**: ${cmd.description}\n`
      })
      .filter(Boolean) as string[]

    arrSplitted.push(mapped)
  }

  arrSplitted.forEach((item, index) => {
    const embed = MinaEmbed.primary()
      .setThumbnail((CommandCategory as any)[category]?.image)
      .setAuthor({ name: `${category} commands` })
      .setDescription(item.join('\n'))
      .setFooter({ text: `page ${index + 1} of ${arrSplitted.length}` })
    arrEmbeds.push(embed)
  })

  return arrEmbeds
}

export default command
