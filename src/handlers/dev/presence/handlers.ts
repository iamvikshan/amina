import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActivityType,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getPresenceConfig, updatePresenceConfig } from '@schemas/Dev'
import { createSecondaryBtn, createSuccessBtn } from '@helpers/componentHelper'
import { updatePresence } from './update'

/**
 * Show presence management menu
 */
export async function showPresenceMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const currentConfig = await getPresenceConfig()

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🎭 Presence Management')
    .setDescription(
      'Configure bot presence/status! 🎭\n\n' +
        '**Current Configuration:**\n' +
        `**Enabled**: ${currentConfig.PRESENCE.ENABLED ? '✅' : '❌'}\n` +
        `**Status**: ${currentConfig.PRESENCE.STATUS}\n` +
        `**Type**: ${currentConfig.PRESENCE.TYPE}\n` +
        `**Message**: ${currentConfig.PRESENCE.MESSAGE}\n` +
        `**URL**: ${currentConfig.PRESENCE.URL || 'N/A'}\n\n` +
        '**Flow:**\n' +
        '1. Enter message and URL (optional) via modal\n' +
        '2. Select activity type\n' +
        '3. Select status\n' +
        '4. Confirm'
    )
    .setFooter({ text: 'Click the button below to start' })

  const startButton = createSuccessBtn({
    customId: 'dev:btn:presence_start',
    label: 'Configure Presence',
    emoji: '🎭',
  })

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_presence',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [startButton, backButton],
  })
}

/**
 * Show presence modal for message and URL input
 */
export async function showPresenceModal(
  interaction: ButtonInteraction
): Promise<void> {
  const { ModalBuilder, TextInputBuilder, TextInputStyle } = await import(
    'discord.js'
  )

  const modal = new ModalBuilder()
    .setCustomId('dev:modal:presence')
    .setTitle('Configure Bot Presence')

  const messageInput = new TextInputBuilder()
    .setCustomId('message')
    .setLabel('Status Message')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Playing with {servers} servers')
    .setRequired(true)
    .setMaxLength(128)

  const urlInput = new TextInputBuilder()
    .setCustomId('url')
    .setLabel('Stream URL (optional, for STREAMING type)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://twitch.tv/...')
    .setRequired(false)
    .setMaxLength(200)

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    messageInput
  )
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    urlInput
  )

  modal.addComponents(firstRow, secondRow)

  await interaction.showModal(modal)
}

/**
 * Handle presence modal submission - show type selection
 */
export async function handlePresenceModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const message = interaction.fields.getTextInputValue('message')
  const url = interaction.fields.getTextInputValue('url') || ''

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🎭 Select Activity Type')
    .setDescription(
      `**Message**: ${message}\n` +
        `**URL**: ${url || 'N/A'}\n\n` +
        'Select the activity type:'
    )

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:presence_type')
      .setPlaceholder('Select activity type...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Playing')
          .setDescription('Playing {message}')
          .setValue('PLAYING')
          .setEmoji('🎮'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Watching')
          .setDescription('Watching {message}')
          .setValue('WATCHING')
          .setEmoji('👀'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Listening')
          .setDescription('Listening to {message}')
          .setValue('LISTENING')
          .setEmoji('🎵'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Streaming')
          .setDescription('Streaming {message}')
          .setValue('STREAMING')
          .setEmoji('📺'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Competing')
          .setDescription('Competing in {message}')
          .setValue('COMPETING')
          .setEmoji('🏆')
      )
  )

  // Store message and URL in custom_id state
  const state = Buffer.from(JSON.stringify({ message, url })).toString('base64')
  menu.components[0].setCustomId(`dev:menu:presence_type|${state}`)

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_presence',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
  })
}

/**
 * Handle presence type selection - show status selection
 */
export async function handlePresenceTypeMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const type = interaction.values[0]
  const customId = interaction.customId
  const parts = customId.split('|')
  const stateEncoded = parts[1]

  let state: { message: string; url: string }
  try {
    const decoded = Buffer.from(stateEncoded, 'base64').toString()
    state = JSON.parse(decoded)
  } catch {
    await interaction.followUp({
      content: '❌ Invalid state. Please try again.',
      ephemeral: true,
    })
    return
  }

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🎭 Select Status')
    .setDescription(
      `**Type**: ${type}\n` +
        `**Message**: ${state.message}\n` +
        `**URL**: ${state.url || 'N/A'}\n\n` +
        'Select the bot status:'
    )

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:presence_status')
      .setPlaceholder('Select status...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Online')
          .setDescription('Green status')
          .setValue('online')
          .setEmoji('🟢'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Idle')
          .setDescription('Yellow status')
          .setValue('idle')
          .setEmoji('🟡'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Do Not Disturb')
          .setDescription('Red status')
          .setValue('dnd')
          .setEmoji('🔴'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Invisible')
          .setDescription('Grey status (offline)')
          .setValue('invisible')
          .setEmoji('⚫')
      )
  )

  // Store all state in custom_id
  const newState = { ...state, type }
  const newStateEncoded = Buffer.from(JSON.stringify(newState)).toString(
    'base64'
  )
  menu.components[0].setCustomId(`dev:menu:presence_status|${newStateEncoded}`)

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_presence',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
  })
}

/**
 * Handle presence status selection - show confirmation
 */
export async function handlePresenceStatusMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const status = interaction.values[0]
  const customId = interaction.customId
  const parts = customId.split('|')
  const stateEncoded = parts[1]

  let state: { message: string; url: string; type: string }
  try {
    const decoded = Buffer.from(stateEncoded, 'base64').toString()
    state = JSON.parse(decoded)
  } catch {
    await interaction.followUp({
      content: '❌ Invalid state. Please try again.',
      ephemeral: true,
    })
    return
  }

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🎭 Confirm Presence Configuration')
    .setDescription(
      '**Configuration Preview:**\n' +
        `**Enabled**: ✅\n` +
        `**Status**: ${status}\n` +
        `**Type**: ${state.type}\n` +
        `**Message**: ${state.message}\n` +
        `**URL**: ${state.url || 'N/A'}\n\n` +
        'Click confirm to apply these settings.'
    )

  // Store all state for confirmation
  const finalState = { ...state, status }
  const finalStateEncoded = Buffer.from(JSON.stringify(finalState)).toString(
    'base64'
  )

  const confirmButton = createSuccessBtn({
    customId: `dev:btn:presence_confirm|${finalStateEncoded}`,
    label: 'Confirm',
    emoji: '✅',
  })

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_presence',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [confirmButton, backButton],
  })
}

/**
 * Handle presence confirmation - apply settings
 */
export async function handlePresenceConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const customId = interaction.customId
  const parts = customId.split('|')
  const stateEncoded = parts[1]

  let state: { message: string; url: string; type: string; status: string }
  try {
    const decoded = Buffer.from(stateEncoded, 'base64').toString()
    state = JSON.parse(decoded)
  } catch {
    await interaction.followUp({
      content: '❌ Invalid state. Please try again.',
      ephemeral: true,
    })
    return
  }

  // Update database
  await updatePresenceConfig({
    PRESENCE: {
      ENABLED: true,
      STATUS: state.status,
      TYPE: state.type,
      MESSAGE: state.message,
      URL: state.url || '',
    },
  })

  // Update bot presence immediately
  await updatePresence(interaction.client as any)

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setTitle('✅ Presence Updated')
    .setDescription('Bot presence configuration has been updated successfully!')
    .addFields([
      {
        name: 'Enabled',
        value: '✅',
        inline: true,
      },
      {
        name: 'Status',
        value: state.status,
        inline: true,
      },
      {
        name: 'Type',
        value: state.type,
        inline: true,
      },
      {
        name: 'Message',
        value: state.message,
        inline: false,
      },
      {
        name: 'URL',
        value: state.url || 'N/A',
        inline: false,
      },
    ])

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_presence',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [backButton],
  })
}
