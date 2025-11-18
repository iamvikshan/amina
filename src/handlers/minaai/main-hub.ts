import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { showMemoriesView } from './memories'
import { showForgetMeConfirmation } from './forget-me'
import { showSettings } from './settings'

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

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: '🧠 Mina AI Memory Management' })
    .setDescription(
      `Welcome to Mina AI Memory Management! 🌟\n\n` +
        `**Current Context:** ${contextName}\n\n` +
        `**Choose an operation:**\n` +
        (isDM
          ? `📖 **View DM Memories** - See what Mina remembers from your DMs\n`
          : `📖 **View Server Memories** - See what Mina remembers from this server\n`) +
        `⚙️ **Settings** - Configure your preferences (including Forget Me)\n\n` +
        (isDM
          ? `💡 To view server memories, use this command in a server.`
          : `💡 To view DM memories, use this command in DMs.`)
    )
    .setFooter({ text: 'Privacy first! Your memories are yours to control 💕' })

  const menuOptions = [
    new StringSelectMenuOptionBuilder()
      .setLabel(isDM ? 'Show DM Memories' : 'Show Server Memories')
      .setDescription(
        isDM ? 'View memories from DMs' : 'View memories from this server'
      )
      .setValue(isDM ? 'memories_dm' : 'memories_server')
      .setEmoji(isDM ? '💬' : '🏠'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Settings')
      .setDescription('Configure your preferences')
      .setValue('settings')
      .setEmoji('⚙️'),
  ]

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('minaai:menu:operation')
      .setPlaceholder('📂 Select an operation...')
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
        content: '❌ Invalid operation selected',
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
