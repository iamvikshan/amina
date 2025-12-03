import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { showMemoriesView } from './memories'
import { showSettings } from './settings'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show main Mina AI hub with operation selection
 */
export async function showMinaAiHub(
  interaction:
    | StringSelectMenuInteraction
    | ButtonInteraction
    | ChatInputCommandInteraction
): Promise<void> {
  const isDM = !interaction.guild
  const contextName = isDM ? 'DM' : 'Server'

  const embed = MinaEmbed.primary()
    .setAuthor({ name: 'mina ai memory management' })
    .setDescription(
      `welcome to mina ai memory management\n\n` +
        `**current context:** ${contextName}\n\n` +
        `**choose an operation:**\n` +
        (isDM
          ? `**view dm memories** - see what mina remembers from your dms\n`
          : `**view server memories** - see what mina remembers from this server\n`) +
        `**settings** - configure your preferences (including forget me)\n\n` +
        (isDM
          ? `tip: to view server memories, use this command in a server.`
          : `tip: to view dm memories, use this command in dms.`)
    )
    .setFooter({ text: 'privacy first! your memories are yours to control' })

  const menuOptions = [
    new StringSelectMenuOptionBuilder()
      .setLabel(isDM ? 'Show DM Memories' : 'Show Server Memories')
      .setDescription(
        isDM ? 'View memories from DMs' : 'View memories from this server'
      )
      .setValue(isDM ? 'memories_dm' : 'memories_server'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Settings')
      .setDescription('Configure your preferences')
      .setValue('settings'),
  ]

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('minaai:menu:operation')
      .setPlaceholder('select an operation...')
      .addOptions(menuOptions)
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menu],
  })
}

/**
 * Handle operation selection from main hub
 */
export async function handleMinaAiOperationMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const operation = interaction.values[0]

  await interaction.deferUpdate()

  switch (operation) {
    case 'memories_server':
      await showMemoriesView(interaction, 'server')
      break
    case 'memories_dm':
      await showMemoriesView(interaction, 'dm')
      break
    case 'settings':
      await showSettings(interaction)
      break
    default:
      await interaction.followUp({
        content: 'invalid operation selected',
        ephemeral: true,
      })
  }
}

/**
 * Handle back button to return to main Mina AI hub
 */
export async function handleMinaAiBackButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showMinaAiHub(interaction)
}
