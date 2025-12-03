import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChatInputCommandInteraction,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import {
  toggleGlobal,
  setModel,
  setTokens,
  setPrompt,
  setTemperature,
  toggleDm,
  memoryStats,
} from '@commands/dev/sub/minaAi'
import { getAiConfig } from '@schemas/Dev'
import { postToBin } from '@helpers/HttpUtils'
import { MinaRows, MinaButtons } from '@helpers/componentHelper'

/**
 * Show Mina AI operations menu with current settings
 */
export async function showMinaAiMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const config = await getAiConfig()

  // Generate pastebin link for prompt if it exists
  let promptField = 'Not set'
  let promptLinkButton: ActionRowBuilder<any> | null = null

  if (config.systemPrompt) {
    const promptPreview =
      config.systemPrompt.length > 200
        ? `${config.systemPrompt.substring(0, 200)}...`
        : config.systemPrompt
    promptField = promptPreview

    // Create pastebin link for full prompt
    const binResponse = await postToBin(
      config.systemPrompt,
      'Amina AI System Prompt'
    )
    if (binResponse) {
      promptLinkButton = MinaRows.single(
        MinaButtons.link(binResponse.url, 'view full prompt')
      )
    }
  }

  const embed = MinaEmbed.primary()
    .setTitle('mina ai configuration')
    .setDescription('**current settings:**')
    .addFields(
      {
        name: 'global status',
        value: config.globallyEnabled ? 'enabled' : 'disabled',
        inline: true,
      },
      {
        name: 'dm support',
        value: config.dmEnabledGlobally ? 'enabled' : 'disabled',
        inline: true,
      },
      {
        name: 'model',
        value: `\`${config.model || 'not set'}\``,
        inline: true,
      },
      {
        name: 'max tokens',
        value: `${config.maxTokens || 'not set'}`,
        inline: true,
      },
      {
        name: 'timeout',
        value: `${config.timeoutMs || 'not set'}ms`,
        inline: true,
      },
      {
        name: 'temperature',
        value: `${config.temperature || 'not set'}`,
        inline: true,
      },
      {
        name: 'system prompt',
        value: promptField,
        inline: false,
      },
      {
        name: 'last updated',
        value: config.updatedAt
          ? `<t:${Math.floor(config.updatedAt.getTime() / 1000)}:R>`
          : 'never',
        inline: true,
      },
      {
        name: 'updated by',
        value: config.updatedBy ? `<@${config.updatedBy}>` : 'n/a',
        inline: true,
      }
    )
    .setFooter({ text: 'select an operation below to edit settings' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:minaai')
      .setPlaceholder('Select an operation to edit...')
      .addOptions(
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

  const backRow = MinaRows.backRow('dev:btn:back_minaai')

  const components: ActionRowBuilder<any>[] = [menu, backRow]
  if (promptLinkButton) {
    components.splice(1, 0, promptLinkButton) // Insert before back button
  }

  await interaction.editReply({
    embeds: [embed],
    components,
  })
}

/**
 * Handle Mina AI operation selection
 */
export async function handleMinaAiMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const operation = interaction.values[0]

  await handleMinaAiOperation(interaction, operation)
}

/**
 * Handle Mina AI operation execution
 */
export async function handleMinaAiOperation(
  interaction: StringSelectMenuInteraction | ButtonInteraction,
  operation: string
): Promise<void> {
  // Define a partial interface for what we need from the interaction
  interface MockInteraction extends Pick<
    ChatInputCommandInteraction,
    'editReply' | 'followUp' | 'user' | 'guild' | 'client'
  > {
    options: {
      getBoolean: (name: string, required?: boolean) => boolean | null
      getString: (name: string, required?: boolean) => string | null
      getInteger: (name: string, required?: boolean) => number | null
      getNumber: (name: string, required?: boolean) => number | null
    }
  }

  // Create a mock ChatInputCommandInteraction-like object for the existing functions
  const mockInteraction: MockInteraction = {
    editReply: interaction.editReply.bind(interaction),
    followUp: interaction.followUp.bind(interaction),
    user: interaction.user,
    guild: interaction.guild,
    client: interaction.client,
    options: {
      getBoolean: (_name: string, _required?: boolean) => {
        // For toggle operations, we'll show a boolean select menu
        return null
      },
      getString: (_name: string, _required?: boolean) => {
        return null
      },
      getInteger: (_name: string, _required?: boolean) => {
        return null
      },
      getNumber: (_name: string, _required?: boolean) => {
        return null
      },
    },
  }

  switch (operation) {
    case 'toggle-global': {
      // Defer before showing new menu
      if (interaction.isStringSelectMenu()) {
        await interaction.deferUpdate()
      }
      // Show boolean select menu
      await showBooleanSelect(
        interaction,
        'toggle-global',
        'Enable/Disable AI Globally'
      )
      break
    }
    case 'set-model': {
      // Don't defer - modals must be shown before deferring
      await showModelModal(interaction)
      break
    }
    case 'set-tokens': {
      // Don't defer - modals must be shown before deferring
      await showTokensModal(interaction)
      break
    }
    case 'set-prompt': {
      // Don't defer - modals must be shown before deferring
      await showPromptModal(interaction)
      break
    }
    case 'set-temperature': {
      // Don't defer - modals must be shown before deferring
      await showTemperatureModal(interaction)
      break
    }
    case 'toggle-dm': {
      // Defer before showing new menu
      if (interaction.isStringSelectMenu()) {
        await interaction.deferUpdate()
      }
      // Show boolean select menu
      await showBooleanSelect(
        interaction,
        'toggle-dm',
        'Enable/Disable Global DM Support'
      )
      break
    }
    case 'memory-stats': {
      // Defer for operations that edit the reply
      if (interaction.isStringSelectMenu()) {
        await interaction.deferUpdate()
      }

      // Create editReply that preserves embeds and adds back button
      const backRow = MinaRows.backRow('dev:btn:back_minaai_menu')

      const statsMockInteraction = {
        ...mockInteraction,
        editReply: async (options: any) => {
          // Merge components with back button
          const components = options.components || []
          if (
            !components.some((row: any) =>
              row.components?.some(
                (btn: any) => btn.data?.custom_id === 'dev:btn:back_minaai_menu'
              )
            )
          ) {
            components.push(backRow)
          }
          return interaction.editReply({
            ...options,
            components,
          })
        },
      }

      await memoryStats(statsMockInteraction as any)
      break
    }
    default: {
      // Defer before sending error message
      if (interaction.isStringSelectMenu()) {
        await interaction.deferUpdate()
      }
      await interaction.followUp({
        content: '❌ Invalid operation selected',
        ephemeral: true,
      })
    }
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
  const embed = MinaEmbed.primary()
    .setTitle(`${title}`)
    .setDescription('select whether to enable or disable:')

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

  const backRow = MinaRows.backRow('dev:btn:back_minaai_menu')

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backRow],
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

  // Create editReply that preserves embeds and adds back button
  const backRow = MinaRows.backRow('dev:btn:back_minaai_menu')

  const mockInteraction = {
    ...interaction,
    options: {
      getBoolean: () => enabled,
    },
    editReply: async (options: any) => {
      // Merge components with back button
      const components = options.components || []
      if (
        !components.some((row: any) =>
          row.components?.some(
            (btn: any) => btn.data?.custom_id === 'dev:btn:back_minaai_menu'
          )
        )
      ) {
        components.push(backRow)
      }
      return interaction.editReply({
        ...options,
        components,
      })
    },
    followUp: interaction.followUp.bind(interaction),
    user: interaction.user,
  } as any

  if (operation === 'toggle-global') {
    await toggleGlobal(mockInteraction, enabled)
  } else if (operation === 'toggle-dm') {
    await toggleDm(mockInteraction, enabled)
  }
}

/**
 * Show modal for model input
 */
async function showModelModal(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const modelInput = new TextInputBuilder({
    customId: 'model',
    label: 'Model Name',
    style: TextInputStyle.Short,
    placeholder: 'e.g., gemini-flash-latest',
    required: true,
    maxLength: 100,
  })

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    modelInput
  )

  const modal = new ModalBuilder({
    customId: 'dev:modal:minaai_model',
    title: 'Set Gemini Model',
    components: [firstRow],
  })

  await interaction.showModal(modal)
}

/**
 * Show modal for tokens input
 */
async function showTokensModal(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const tokensInput = new TextInputBuilder({
    customId: 'tokens',
    label: 'Max Tokens (100-4096)',
    style: TextInputStyle.Short,
    placeholder: '2048',
    required: true,
    maxLength: 10,
  })

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    tokensInput
  )

  const modal = new ModalBuilder({
    customId: 'dev:modal:minaai_tokens',
    title: 'Set Max Tokens',
    components: [firstRow],
  })

  await interaction.showModal(modal)
}

/**
 * Show modal for prompt input
 */
async function showPromptModal(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const promptInput = new TextInputBuilder({
    customId: 'prompt',
    label: 'System Prompt',
    style: TextInputStyle.Paragraph,
    placeholder: 'Enter the system prompt...',
    required: true,
    maxLength: 4000,
  })

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    promptInput
  )

  const modal = new ModalBuilder({
    customId: 'dev:modal:minaai_prompt',
    title: 'Set System Prompt',
    components: [firstRow],
  })

  await interaction.showModal(modal)
}

/**
 * Show modal for temperature input
 */
async function showTemperatureModal(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const temperatureInput = new TextInputBuilder({
    customId: 'temperature',
    label: 'Temperature (0-2)',
    style: TextInputStyle.Short,
    placeholder: '0.7',
    required: true,
    maxLength: 10,
  })

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    temperatureInput
  )

  const modal = new ModalBuilder({
    customId: 'dev:modal:minaai_temperature',
    title: 'Set Temperature',
    components: [firstRow],
  })

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

  // Create editReply that preserves embeds and adds back button
  const backRow = MinaRows.backRow('dev:btn:back_minaai_menu')

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
    editReply: async (options: any) => {
      // Merge components with back button
      const components = options.components || []
      if (
        !components.some((row: any) =>
          row.components?.some(
            (btn: any) => btn.data?.custom_id === 'dev:btn:back_minaai_menu'
          )
        )
      ) {
        components.push(backRow)
      }
      return interaction.editReply({
        ...options,
        components,
      })
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
}
