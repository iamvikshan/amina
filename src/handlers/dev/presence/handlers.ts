import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
  ModalBuilder,
  TextInputStyle,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { getPresenceConfig, updatePresenceConfig } from '@schemas/Dev'
import { MinaRows } from '@helpers/componentHelper'
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

  const embed = MinaEmbed.primary()
    .setTitle('presence management')
    .setDescription(
      'configure bot presence/status\n\n' +
        '**current configuration:**\n' +
        `**enabled**: ${ENABLED ? 'yes' : 'no'}\n` +
        `**status**: \`${STATUS}\`\n` +
        `**type**: \`${TYPE}\`\n` +
        `**message**: \`${MESSAGE}\`\n` +
        `**url**: ${URL || 'n/a'}\n\n` +
        '**select an operation to update:**'
    )
    .setFooter({ text: 'changes are applied immediately' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:presence_operation')
      .setPlaceholder('select an operation...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(ENABLED ? 'disable presence' : 'enable presence')
          .setDescription(
            ENABLED ? 'turn off custom presence' : 'turn on custom presence'
          )
          .setValue('toggle_enabled'),
        new StringSelectMenuOptionBuilder()
          .setLabel('edit message & url')
          .setDescription('update the status message and stream url')
          .setValue('edit_message'),
        new StringSelectMenuOptionBuilder()
          .setLabel('set activity type')
          .setDescription('change activity type (playing, watching, etc.)')
          .setValue('set_type'),
        new StringSelectMenuOptionBuilder()
          .setLabel('set status')
          .setDescription('change online status (online, idle, dnd, etc.)')
          .setValue('set_status')
      )
  )

  const backRow = MinaRows.backRow('dev:btn:back_presence')

  // If called from a modal submit, we must use editReply or update
  if (interaction.isModalSubmit()) {
    await interaction.editReply({
      embeds: [embed],
      components: [menu, backRow],
    })
  } else {
    await interaction.editReply({
      embeds: [embed],
      components: [menu, backRow],
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

  const messageInput = new TextInputBuilder({
    customId: 'message',
    label: 'status message',
    style: TextInputStyle.Short,
    placeholder: 'playing with {servers} servers',
    value: config.PRESENCE.MESSAGE,
    required: true,
    maxLength: 128,
  })

  const urlInput = new TextInputBuilder({
    customId: 'url',
    label: 'stream url (optional)',
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

  const modal = new ModalBuilder({
    customId: 'dev:modal:presence',
    title: 'configure bot presence',
    components: [firstRow, secondRow],
  })

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

  const embed = MinaEmbed.primary()
    .setTitle('select activity type')
    .setDescription(`current type: \`${config.PRESENCE.TYPE}\``)

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:presence_type')
      .setPlaceholder('select activity type...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('playing')
          .setDescription('playing {message}')
          .setValue('PLAYING')
          .setDefault(config.PRESENCE.TYPE === 'PLAYING'),
        new StringSelectMenuOptionBuilder()
          .setLabel('watching')
          .setDescription('watching {message}')
          .setValue('WATCHING')
          .setDefault(config.PRESENCE.TYPE === 'WATCHING'),
        new StringSelectMenuOptionBuilder()
          .setLabel('listening')
          .setDescription('listening to {message}')
          .setValue('LISTENING')
          .setDefault(config.PRESENCE.TYPE === 'LISTENING'),
        new StringSelectMenuOptionBuilder()
          .setLabel('streaming')
          .setDescription('streaming {message}')
          .setValue('STREAMING')
          .setDefault(config.PRESENCE.TYPE === 'STREAMING'),
        new StringSelectMenuOptionBuilder()
          .setLabel('competing')
          .setDescription('competing in {message}')
          .setValue('COMPETING')
          .setDefault(config.PRESENCE.TYPE === 'COMPETING')
      )
  )

  const backRow = MinaRows.backRow('dev:btn:back_presence_menu')

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backRow],
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

  const embed = MinaEmbed.primary()
    .setTitle('select status')
    .setDescription(`current status: \`${config.PRESENCE.STATUS}\``)

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:presence_status')
      .setPlaceholder('select status...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('online')
          .setDescription('green status')
          .setValue('online')
          .setDefault(config.PRESENCE.STATUS === 'online'),
        new StringSelectMenuOptionBuilder()
          .setLabel('idle')
          .setDescription('yellow status')
          .setValue('idle')
          .setDefault(config.PRESENCE.STATUS === 'idle'),
        new StringSelectMenuOptionBuilder()
          .setLabel('do not disturb')
          .setDescription('red status')
          .setValue('dnd')
          .setDefault(config.PRESENCE.STATUS === 'dnd'),
        new StringSelectMenuOptionBuilder()
          .setLabel('invisible')
          .setDescription('grey status (offline)')
          .setValue('invisible')
          .setDefault(config.PRESENCE.STATUS === 'invisible')
      )
  )

  const backRow = MinaRows.backRow('dev:btn:back_presence_menu')

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backRow],
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
