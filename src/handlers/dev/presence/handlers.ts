import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  ModalBuilder,
  TextInputStyle,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getPresenceConfig, updatePresenceConfig } from '@schemas/Dev'
import { createSecondaryBtn } from '@helpers/componentHelper'
import { updatePresence } from './update'

/**
 * Show presence management menu (Hub Flow)
 */
export async function showPresenceMenu(
  interaction:
    | StringSelectMenuInteraction
    | ButtonInteraction
    | ModalSubmitInteraction
): Promise<void> {
  const currentConfig = await getPresenceConfig()
  const { ENABLED, STATUS, TYPE, MESSAGE, URL } = currentConfig.PRESENCE

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🎭 Presence Management')
    .setDescription(
      'Configure bot presence/status! 🎭\n\n' +
        '**Current Configuration:**\n' +
        `**Enabled**: ${ENABLED ? '✅' : '❌'}\n` +
        `**Status**: \`${STATUS}\`\n` +
        `**Type**: \`${TYPE}\`\n` +
        `**Message**: \`${MESSAGE}\`\n` +
        `**URL**: ${URL || 'N/A'}\n\n` +
        '**Select an operation to update:**'
    )
    .setFooter({ text: 'Changes are applied immediately' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:presence_operation')
      .setPlaceholder('Select an operation...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(ENABLED ? 'Disable Presence' : 'Enable Presence')
          .setDescription(
            ENABLED ? 'Turn off custom presence' : 'Turn on custom presence'
          )
          .setValue('toggle_enabled')
          .setEmoji(ENABLED ? '🔴' : '🟢'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Edit Message & URL')
          .setDescription('Update the status message and stream URL')
          .setValue('edit_message')
          .setEmoji('📝'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Set Activity Type')
          .setDescription('Change activity type (Playing, Watching, etc.)')
          .setValue('set_type')
          .setEmoji('🎮'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Set Status')
          .setDescription('Change online status (Online, Idle, DND, etc.)')
          .setValue('set_status')
          .setEmoji('🟢')
      )
  )

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_presence',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  // If called from a modal submit, we must use editReply or update
  if (interaction.isModalSubmit()) {
    await interaction.editReply({
      embeds: [embed],
      components: [menu, backButton],
    })
  } else {
    await interaction.editReply({
      embeds: [embed],
      components: [menu, backButton],
    })
  }
}

/**
 * Handle presence operation selection
 */
export async function handlePresenceOperation(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const operation = interaction.values[0]

  switch (operation) {
    case 'toggle_enabled':
      await handleToggleEnabled(interaction)
      break
    case 'edit_message':
      await showPresenceModal(interaction)
      break
    case 'set_type':
      await showTypeSelection(interaction)
      break
    case 'set_status':
      await showStatusSelection(interaction)
      break
    default:
      await interaction.deferUpdate()
      await showPresenceMenu(interaction)
  }
}

/**
 * Toggle presence enabled/disabled
 */
async function handleToggleEnabled(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()
  const config = await getPresenceConfig()
  const newEnabled = !config.PRESENCE.ENABLED

  await updatePresenceConfig({
    PRESENCE: {
      ...config.PRESENCE,
      ENABLED: newEnabled,
    },
  })

  await updatePresence(interaction.client as any)
  await showPresenceMenu(interaction)
}

/**
 * Show presence modal for message and URL input
 */
export async function showPresenceModal(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const config = await getPresenceConfig()

  const modal = new ModalBuilder()
    .setCustomId('dev:modal:presence')
    .setTitle('Configure Bot Presence')

  const messageInput = new TextInputBuilder({
    customId: 'message',
    label: 'Status Message',
    style: TextInputStyle.Short,
    placeholder: 'Playing with {servers} servers',
    value: config.PRESENCE.MESSAGE,
    required: true,
    maxLength: 128,
  })

  const urlInput = new TextInputBuilder({
    customId: 'url',
    label: 'Stream URL (optional)',
    style: TextInputStyle.Short,
    placeholder: 'https://twitch.tv/...',
    value: config.PRESENCE.URL || '',
    required: false,
    maxLength: 200,
  })

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    messageInput
  )
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    urlInput
  )

  modal.addComponents([firstRow, secondRow])

  await interaction.showModal(modal)
}

/**
 * Handle presence modal submission
 */
export async function handlePresenceModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const message = interaction.fields.getTextInputValue('message')
  const url = interaction.fields.getTextInputValue('url') || ''

  const config = await getPresenceConfig()
  await updatePresenceConfig({
    PRESENCE: {
      ...config.PRESENCE,
      MESSAGE: message,
      URL: url,
    },
  })

  await updatePresence(interaction.client as any)
  await showPresenceMenu(interaction)
}

/**
 * Show activity type selection menu
 */
async function showTypeSelection(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()
  const config = await getPresenceConfig()

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🎮 Select Activity Type')
    .setDescription(`Current Type: \`${config.PRESENCE.TYPE}\``)

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:presence_type')
      .setPlaceholder('Select activity type...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Playing')
          .setDescription('Playing {message}')
          .setValue('PLAYING')
          .setEmoji('🎮')
          .setDefault(config.PRESENCE.TYPE === 'PLAYING'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Watching')
          .setDescription('Watching {message}')
          .setValue('WATCHING')
          .setEmoji('👀')
          .setDefault(config.PRESENCE.TYPE === 'WATCHING'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Listening')
          .setDescription('Listening to {message}')
          .setValue('LISTENING')
          .setEmoji('🎵')
          .setDefault(config.PRESENCE.TYPE === 'LISTENING'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Streaming')
          .setDescription('Streaming {message}')
          .setValue('STREAMING')
          .setEmoji('📺')
          .setDefault(config.PRESENCE.TYPE === 'STREAMING'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Competing')
          .setDescription('Competing in {message}')
          .setValue('COMPETING')
          .setEmoji('🏆')
          .setDefault(config.PRESENCE.TYPE === 'COMPETING')
      )
  )

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_presence_menu',
    label: 'Back to Presence Menu',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
  })
}

/**
 * Handle activity type selection
 */
export async function handlePresenceTypeMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()
  const type = interaction.values[0]

  const config = await getPresenceConfig()
  await updatePresenceConfig({
    PRESENCE: {
      ...config.PRESENCE,
      TYPE: type,
    },
  })

  await updatePresence(interaction.client as any)
  await showPresenceMenu(interaction)
}

/**
 * Show status selection menu
 */
async function showStatusSelection(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()
  const config = await getPresenceConfig()

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🟢 Select Status')
    .setDescription(`Current Status: \`${config.PRESENCE.STATUS}\``)

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:presence_status')
      .setPlaceholder('Select status...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Online')
          .setDescription('Green status')
          .setValue('online')
          .setEmoji('🟢')
          .setDefault(config.PRESENCE.STATUS === 'online'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Idle')
          .setDescription('Yellow status')
          .setValue('idle')
          .setEmoji('🟡')
          .setDefault(config.PRESENCE.STATUS === 'idle'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Do Not Disturb')
          .setDescription('Red status')
          .setValue('dnd')
          .setEmoji('🔴')
          .setDefault(config.PRESENCE.STATUS === 'dnd'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Invisible')
          .setDescription('Grey status (offline)')
          .setValue('invisible')
          .setEmoji('⚫')
          .setDefault(config.PRESENCE.STATUS === 'invisible')
      )
  )

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_presence_menu',
    label: 'Back to Presence Menu',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
  })
}

/**
 * Handle status selection
 */
export async function handlePresenceStatusMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()
  const status = interaction.values[0]

  const config = await getPresenceConfig()
  await updatePresenceConfig({
    PRESENCE: {
      ...config.PRESENCE,
      STATUS: status,
    },
  })

  await updatePresence(interaction.client as any)
  await showPresenceMenu(interaction)
}

/**
 * Handle back button to presence menu
 */
export async function handleBackToPresenceMenu(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showPresenceMenu(interaction)
}

/**
 * Handle presence confirm button
 */
export async function handlePresenceConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showPresenceMenu(interaction)
}
