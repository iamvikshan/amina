import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show main dev hub with category selection
 */
export async function showDevHub(
  interaction:
    | StringSelectMenuInteraction
    | ButtonInteraction
    | ChatInputCommandInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle('developer hub')
    .setDescription(
      'welcome to the developer hub\n\n' +
        '**select a category:**\n' +
        '**presence management** - configure bot presence/status\n' +
        '**truth or dare** - add/remove tod questions\n' +
        '**command reload** - reload commands, events, or contexts\n' +
        '**trigger settings** - trigger server onboarding\n' +
        '**list servers** - view all servers the bot is in\n' +
        '**leave server** - leave a server by id\n' +
        '**mina ai** - configure amina ai settings\n\n' +
        '**note:** all operations are developer-only.'
    )
    .setFooter({ text: 'select a category to begin' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:category')
      .setPlaceholder('select a category...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('presence management')
          .setDescription('configure bot presence/status')
          .setValue('presence'),
        new StringSelectMenuOptionBuilder()
          .setLabel('truth or dare')
          .setDescription('add/remove tod questions')
          .setValue('tod'),
        new StringSelectMenuOptionBuilder()
          .setLabel('command reload')
          .setDescription('reload commands, events, or contexts')
          .setValue('reload'),
        new StringSelectMenuOptionBuilder()
          .setLabel('trigger settings')
          .setDescription('trigger server onboarding')
          .setValue('trig-settings'),
        new StringSelectMenuOptionBuilder()
          .setLabel('list servers')
          .setDescription('view all servers the bot is in')
          .setValue('listservers'),
        new StringSelectMenuOptionBuilder()
          .setLabel('leave server')
          .setDescription('leave a server by id')
          .setValue('leaveserver'),
        new StringSelectMenuOptionBuilder()
          .setLabel('mina ai')
          .setDescription('configure amina ai settings')
          .setValue('minaai')
      )
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menu],
  })
}

/**
 * Handle category selection
 */
export async function handleCategoryMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const category = interaction.values[0]

  // Handle modal actions BEFORE deferring (modals cannot be shown after defer)
  if (category === 'leaveserver') {
    const { showLeaveServerModal } = await import('./leaveserver')
    await showLeaveServerModal(interaction)
    return
  }

  // Defer for all other actions that will edit the reply
  await interaction.deferUpdate()

  // Route to appropriate category handler
  switch (category) {
    case 'presence': {
      const { showPresenceMenu } = await import('./presence')
      await showPresenceMenu(interaction)
      break
    }
    case 'tod': {
      const { showTodMenu } = await import('./tod')
      await showTodMenu(interaction)
      break
    }
    case 'reload': {
      const { showReloadMenu } = await import('./reload')
      await showReloadMenu(interaction)
      break
    }
    case 'trig-settings': {
      const { showTrigSettings } = await import('./trig-settings')
      await showTrigSettings(interaction)
      break
    }
    case 'listservers': {
      const { showListservers } = await import('./listservers')
      await showListservers(interaction)
      break
    }
    case 'minaai': {
      const { showMinaAiMenu } = await import('./minaai')
      await showMinaAiMenu(interaction)
      break
    }
    default:
      await interaction.followUp({
        content: '❌ Invalid category selected',
        ephemeral: true,
      })
  }
}

/**
 * Handle back button - return to main hub
 */
export async function handleDevBackButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showDevHub(interaction)
}
