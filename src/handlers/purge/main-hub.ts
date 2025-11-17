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
import { createPrimaryBtn, createSecondaryBtn } from '@helpers/componentHelper'

/**
 * Show main purge hub with type selection
 */
export async function showPurgeHub(
  interaction:
    | StringSelectMenuInteraction
    | ButtonInteraction
    | ChatInputCommandInteraction
): Promise<void> {
  // Command handler already defers ChatInputCommandInteraction, so we use editReply
  // For other interactions, they should already be in a state where editReply works
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🧹 Message Purge Hub')
    .setDescription(
      'Welcome to the Message Purge Hub! 🗑️\n\n' +
        '**Select a purge type:**\n' +
        '📝 **All Messages** - Delete all messages\n' +
        '📎 **Attachments** - Delete messages with attachments\n' +
        '🤖 **Bot Messages** - Delete messages from bots\n' +
        '🔗 **Links** - Delete messages containing links\n' +
        '🔍 **Token** - Delete messages containing a keyword/token\n' +
        '👤 **User** - Delete messages from a specific user\n\n' +
        '⚠️ **Note:** Messages older than 14 days cannot be bulk deleted.'
    )
    .setFooter({ text: 'Select a purge type to begin' })

  // Check if this is a fresh command (ChatInputCommandInteraction) for default flow
  const isDefaultFlow = interaction.isChatInputCommand()

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('purge:menu:type')
      .setPlaceholder('🔍 Select a purge type...')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('All Messages')
          .setDescription('Delete all messages in the channel')
          .setValue('all')
          .setEmoji('📝')
          .setDefault(isDefaultFlow), // Preselect for default flow
        new StringSelectMenuOptionBuilder()
          .setLabel('Attachments')
          .setDescription('Delete messages with attachments')
          .setValue('attachments')
          .setEmoji('📎'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Bot Messages')
          .setDescription('Delete messages from bots')
          .setValue('bots')
          .setEmoji('🤖'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Links')
          .setDescription('Delete messages containing links')
          .setValue('links')
          .setEmoji('🔗'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Token/Keyword')
          .setDescription('Delete messages containing a keyword')
          .setValue('token')
          .setEmoji('🔍'),
        new StringSelectMenuOptionBuilder()
          .setLabel('User Messages')
          .setDescription('Delete messages from a specific user')
          .setValue('user')
          .setEmoji('👤'),
      ])
  )

  const components: any[] = [menu]

  // Add Proceed button for default flow (All Messages preselected)
  if (isDefaultFlow) {
    const proceedButton = createPrimaryBtn({
      customId: 'purge:btn:proceed_type|default:true',
      label: 'Proceed',
      emoji: '➡️',
    })
    components.push(proceedButton)
  }

  // Command handler already defers, so use editReply for all cases
  await interaction.editReply({
    embeds: [embed],
    components,
  })
}

/**
 * Handle purge type selection
 */
export async function handlePurgeTypeMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const purgeType = interaction.values[0]

  await interaction.deferUpdate()

  // Route to appropriate parameter collection handler
  switch (purgeType) {
    case 'all':
    case 'attachments':
    case 'bots':
    case 'links': {
      // These types need: amount selection → optional channel → preview
      const { showAmountSelect } = await import('./parameters/amount-select')
      await showAmountSelect(interaction, purgeType)
      break
    }
    case 'token': {
      // Token needs: modal for keyword → amount selection → optional channel → preview
      const { showTokenModal } = await import('./parameters/token-modal')
      await showTokenModal(interaction)
      break
    }
    case 'user': {
      // User needs: user select → amount selection → optional channel → preview
      const { showUserSelect } = await import('./parameters/user-select')
      await showUserSelect(interaction)
      break
    }
    default:
      await interaction.followUp({
        content: '❌ Invalid purge type selected',
        ephemeral: true,
      })
  }
}

/**
 * Handle proceed button for default flow (All Messages preselected)
 */
export async function handleProceedType(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  // Proceed with default: all messages, 100 amount, current channel
  const { showAmountSelect } = await import('./parameters/amount-select')
  await showAmountSelect(interaction, 'all', undefined, true) // isDefault = true
}

/**
 * Handle back button to return to main hub
 */
export async function handlePurgeBackButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showPurgeHub(interaction)
}
