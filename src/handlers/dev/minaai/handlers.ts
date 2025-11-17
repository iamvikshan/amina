import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import {
  aiStatus,
  toggleGlobal,
  setModel,
  setTokens,
  setPrompt,
  setTemperature,
  toggleDm,
  memoryStats,
} from '@commands/dev/sub/minaAi'
import { createSecondaryBtn } from '@helpers/componentHelper'
import type { ChatInputCommandInteraction } from 'discord.js'

/**
 * Show Mina AI operations menu
 */
export async function showMinaAiMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🤖 Mina AI Configuration')
    .setDescription(
      'Configure Amina AI settings! 🤖\n\n' +
        '**Select an operation:**\n' +
        '📊 **Status** - View current AI configuration\n' +
        '⚡ **Toggle Global** - Enable/disable AI globally\n' +
        '🧠 **Set Model** - Change the Gemini model\n' +
        '📝 **Set Tokens** - Set max tokens (100-4096)\n' +
        '💬 **Set Prompt** - Update system prompt\n' +
        '🌡️ **Set Temperature** - Set temperature (0-2)\n' +
        '📬 **Toggle DM** - Enable/disable global DM support\n' +
        '🧠 **Memory Stats** - View memory system statistics'
    )
    .setFooter({ text: 'Select an operation to begin' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:minaai')
      .setPlaceholder('Select an operation...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Status')
          .setDescription('View current AI configuration')
          .setValue('status')
          .setEmoji('📊'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Toggle Global')
          .setDescription('Enable/disable AI globally')
          .setValue('toggle-global')
          .setEmoji('⚡'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Set Model')
          .setDescription('Change the Gemini model')
          .setValue('set-model')
          .setEmoji('🧠'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Set Tokens')
          .setDescription('Set max tokens (100-4096)')
          .setValue('set-tokens')
          .setEmoji('📝'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Set Prompt')
          .setDescription('Update system prompt')
          .setValue('set-prompt')
          .setEmoji('💬'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Set Temperature')
          .setDescription('Set temperature (0-2)')
          .setValue('set-temperature')
          .setEmoji('🌡️'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Toggle DM')
          .setDescription('Enable/disable global DM support')
          .setValue('toggle-dm')
          .setEmoji('📬'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Memory Stats')
          .setDescription('View memory system statistics')
          .setValue('memory-stats')
          .setEmoji('🧠')
      )
  )

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_minaai',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
  })
}

/**
 * Handle Mina AI operation selection
 */
export async function handleMinaAiMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const operation = interaction.values[0]

  await interaction.deferUpdate()

  await handleMinaAiOperation(interaction, operation)
}

/**
 * Handle Mina AI operation execution
 */
export async function handleMinaAiOperation(
  interaction: StringSelectMenuInteraction | ButtonInteraction,
  operation: string
): Promise<void> {
  // Create a mock ChatInputCommandInteraction-like object for the existing functions
  const mockInteraction = {
    ...interaction,
    options: {
      getBoolean: (name: string, required?: boolean) => {
        // For toggle operations, we'll show a boolean select menu
        return null
      },
      getString: (name: string, required?: boolean) => {
        return null
      },
      getInteger: (name: string, required?: boolean) => {
        return null
      },
      getNumber: (name: string, required?: boolean) => {
        return null
      },
    },
    followUp: interaction.followUp.bind(interaction),
    user: interaction.user,
  } as any

  switch (operation) {
    case 'status':
      await aiStatus(mockInteraction)
      break
    case 'toggle-global': {
      // Show boolean select menu
      await showBooleanSelect(
        interaction,
        'toggle-global',
        'Enable/Disable AI Globally'
      )
      break
    }
    case 'set-model': {
      // Show modal for model input
      await showModelModal(interaction)
      break
    }
    case 'set-tokens': {
      // Show modal for tokens input
      await showTokensModal(interaction)
      break
    }
    case 'set-prompt': {
      // Show modal for prompt input
      await showPromptModal(interaction)
      break
    }
    case 'set-temperature': {
      // Show modal for temperature input
      await showTemperatureModal(interaction)
      break
    }
    case 'toggle-dm': {
      // Show boolean select menu
      await showBooleanSelect(
        interaction,
        'toggle-dm',
        'Enable/Disable Global DM Support'
      )
      break
    }
    case 'memory-stats':
      await memoryStats(mockInteraction)
      break
    default:
      await interaction.followUp({
        content: '❌ Invalid operation selected',
        ephemeral: true,
      })
  }
}

/**
 * Show boolean select menu for toggle operations
 */
async function showBooleanSelect(
  interaction: StringSelectMenuInteraction | ButtonInteraction,
  operation: string,
  title: string
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle(`🤖 ${title}`)
    .setDescription('Select whether to enable or disable:')

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`dev:menu:minaai_${operation}`)
      .setPlaceholder('Select option...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Enable')
          .setDescription('Enable this feature')
          .setValue('true')
          .setEmoji('✅'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Disable')
          .setDescription('Disable this feature')
          .setValue('false')
          .setEmoji('❌')
      )
  )

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_minaai',
    label: 'Back to Mina AI Menu',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
  })
}

/**
 * Handle boolean select for toggle operations
 */
export async function handleMinaAiToggle(
  interaction: StringSelectMenuInteraction,
  operation: string
): Promise<void> {
  await interaction.deferUpdate()

  const enabled = interaction.values[0] === 'true'

  const mockInteraction = {
    ...interaction,
    options: {
      getBoolean: () => enabled,
    },
    followUp: interaction.followUp.bind(interaction),
    user: interaction.user,
  } as any

  if (operation === 'toggle-global') {
    await toggleGlobal(mockInteraction, enabled)
  } else if (operation === 'toggle-dm') {
    await toggleDm(mockInteraction, enabled)
  }

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_minaai',
    label: 'Back to Mina AI Menu',
    emoji: '◀️',
  })

  await interaction.editReply({
    components: [backButton],
  })
}

/**
 * Show modal for model input
 */
async function showModelModal(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('dev:modal:minaai_model')
    .setTitle('Set Gemini Model')

  const modelInput = new TextInputBuilder()
    .setCustomId('model')
    .setLabel('Model Name')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., gemini-flash-latest')
    .setRequired(true)
    .setMaxLength(100)

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    modelInput
  )

  modal.addComponents(firstRow)

  await interaction.showModal(modal)
}

/**
 * Show modal for tokens input
 */
async function showTokensModal(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('dev:modal:minaai_tokens')
    .setTitle('Set Max Tokens')

  const tokensInput = new TextInputBuilder()
    .setCustomId('tokens')
    .setLabel('Max Tokens (100-4096)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('2048')
    .setRequired(true)
    .setMaxLength(10)

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    tokensInput
  )

  modal.addComponents(firstRow)

  await interaction.showModal(modal)
}

/**
 * Show modal for prompt input
 */
async function showPromptModal(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('dev:modal:minaai_prompt')
    .setTitle('Set System Prompt')

  const promptInput = new TextInputBuilder()
    .setCustomId('prompt')
    .setLabel('System Prompt')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Enter the system prompt...')
    .setRequired(true)
    .setMaxLength(4000)

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    promptInput
  )

  modal.addComponents(firstRow)

  await interaction.showModal(modal)
}

/**
 * Show modal for temperature input
 */
async function showTemperatureModal(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('dev:modal:minaai_temperature')
    .setTitle('Set Temperature')

  const temperatureInput = new TextInputBuilder()
    .setCustomId('temperature')
    .setLabel('Temperature (0-2)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('0.7')
    .setRequired(true)
    .setMaxLength(10)

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    temperatureInput
  )

  modal.addComponents(firstRow)

  await interaction.showModal(modal)
}

/**
 * Handle modal submissions for Mina AI
 */
export async function handleMinaAiModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  await interaction.deferReply({ ephemeral: true })

  const customId = interaction.customId

  const mockInteraction = {
    ...interaction,
    options: {
      getString: (name: string) => {
        return interaction.fields.getTextInputValue(name)
      },
      getInteger: (name: string) => {
        const value = interaction.fields.getTextInputValue(name)
        return value ? parseInt(value, 10) : null
      },
      getNumber: (name: string) => {
        const value = interaction.fields.getTextInputValue(name)
        return value ? parseFloat(value) : null
      },
    },
    followUp: interaction.followUp.bind(interaction),
    user: interaction.user,
  } as any

  if (customId === 'dev:modal:minaai_model') {
    const model = interaction.fields.getTextInputValue('model')
    await setModel(mockInteraction, model)
  } else if (customId === 'dev:modal:minaai_tokens') {
    const tokens = parseInt(interaction.fields.getTextInputValue('tokens'), 10)
    await setTokens(mockInteraction, tokens)
  } else if (customId === 'dev:modal:minaai_prompt') {
    const prompt = interaction.fields.getTextInputValue('prompt')
    await setPrompt(mockInteraction, prompt)
  } else if (customId === 'dev:modal:minaai_temperature') {
    const temperature = parseFloat(
      interaction.fields.getTextInputValue('temperature')
    )
    await setTemperature(mockInteraction, temperature)
  }

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_minaai',
    label: 'Back to Mina AI Menu',
    emoji: '◀️',
  })

  await interaction.editReply({
    components: [backButton],
  })
}
