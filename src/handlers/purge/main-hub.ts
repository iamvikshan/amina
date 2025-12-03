import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonStyle,
} from 'discord.js'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

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
  const embed = MinaEmbed.primary()
    .setTitle('message purge hub')
    .setDescription(
      'select a purge type:\n\n' +
        '**all messages** - delete all messages\n' +
        '**attachments** - delete messages with attachments\n' +
        '**bot messages** - delete messages from bots\n' +
        '**links** - delete messages containing links\n' +
        '**token** - delete messages containing a keyword/token\n' +
        '**user** - delete messages from a specific user\n\n' +
        'note: messages older than 14 days cannot be bulk deleted.'
    )
    .setFooter({ text: 'select a purge type to begin' })

  // Check if this is a fresh command (ChatInputCommandInteraction) for default flow
  const isDefaultFlow = interaction.isChatInputCommand()

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('purge:menu:type')
      .setPlaceholder('select a purge type...')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('All Messages')
          .setDescription('Delete all messages in the channel')
          .setValue('all')
          .setDefault(isDefaultFlow), // Preselect for default flow
        new StringSelectMenuOptionBuilder()
          .setLabel('Attachments')
          .setDescription('Delete messages with attachments')
          .setValue('attachments'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Bot Messages')
          .setDescription('Delete messages from bots')
          .setValue('bots'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Links')
          .setDescription('Delete messages containing links')
          .setValue('links'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Token/Keyword')
          .setDescription('Delete messages containing a keyword')
          .setValue('token'),
        new StringSelectMenuOptionBuilder()
          .setLabel('User Messages')
          .setDescription('Delete messages from a specific user')
          .setValue('user'),
      ])
  )

  const components: any[] = [menu]

  // Add Proceed button for default flow (All Messages preselected)
  if (isDefaultFlow) {
    const proceedRow = MinaRows.single(
      MinaButtons.custom(
        'purge:btn:proceed_type|default:true',
        'proceed',
        ButtonStyle.Primary
      )
    )
    components.push(proceedRow)
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
        content: 'invalid purge type selected',
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
