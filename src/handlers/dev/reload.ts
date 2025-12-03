import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { config } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import type { BotClient } from '@src/structures'
import { MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

/**
 * Show reload menu
 */
export async function showReloadMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle(mina.say('dev.reload.title'))
    .setDescription(mina.say('dev.reload.description'))
    .setFooter({ text: mina.say('dev.reload.footer') })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('dev:menu:reload_type')
      .setPlaceholder(mina.say('dev.reload.placeholder'))
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(mina.say('dev.reload.option.commands.label'))
          .setDescription(mina.say('dev.reload.option.commands.description'))
          .setValue('commands'),
        new StringSelectMenuOptionBuilder()
          .setLabel(mina.say('dev.reload.option.events.label'))
          .setDescription(mina.say('dev.reload.option.events.description'))
          .setValue('events'),
        new StringSelectMenuOptionBuilder()
          .setLabel(mina.say('dev.reload.option.contexts.label'))
          .setDescription(mina.say('dev.reload.option.contexts.description'))
          .setValue('contexts'),
        new StringSelectMenuOptionBuilder()
          .setLabel(mina.say('dev.reload.option.all.label'))
          .setDescription(mina.say('dev.reload.option.all.description'))
          .setValue('all')
      )
  )

  const backButton = MinaRows.backRow('dev:btn:back_reload')

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
  })
}

/**
 * Handle reload type selection
 */
export async function handleReloadType(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const reloadType = interaction.values[0]

  await interaction.deferUpdate()

  const client = interaction.client as BotClient

  // Helper to register commands
  const registerCommands = async () => {
    const devConfig = await import('@schemas/Dev').then(m =>
      m.getDevCommandsConfig()
    )

    // Register devOnly and testGuildOnly commands to test guild
    const testGuild = client.guilds.cache.get(
      config.BOT.TEST_GUILD_ID as string
    )
    if (testGuild) {
      const testGuildCommands = client.slashCommands
        .filter(
          cmd =>
            // Only dev and test commands - regular commands come from global registration
            cmd.testGuildOnly || (cmd.devOnly && devConfig.ENABLED)
        )
        .map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          type: 1, // ApplicationCommandType.ChatInput
          options: cmd.slashCommand.options,
          dm_permission: cmd.dmCommand ?? false,
        }))

      await testGuild.commands.set(testGuildCommands)
      client.logger.success(
        `Registered ${testGuildCommands.length} test guild commands`
      )
    }

    // Also register global commands if GLOBAL=true
    if (client.config.INTERACTIONS.GLOBAL) {
      const globalCommands = client.slashCommands
        .filter(cmd => !cmd.testGuildOnly && !cmd.devOnly)
        .map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          type: 1, // ApplicationCommandType.ChatInput
          options: cmd.slashCommand.options,
          dm_permission: cmd.dmCommand ?? false,
        }))

      if (globalCommands.length > 0) {
        await client.application?.commands.set(globalCommands)
        client.logger.success(
          `Registered ${globalCommands.length} global commands (may take up to 1 hour to propagate)`
        )
      }
    }
  }

  try {
    switch (reloadType.toLowerCase()) {
      case 'commands':
        client.loadCommands('src/commands')
        await registerCommands()
        break
      case 'events':
        client.loadEvents('src/events')
        break
      case 'contexts':
        client.loadContexts('src/contexts')
        await registerCommands()
        break
      case 'all':
        client.loadCommands('src/commands')
        client.loadContexts('src/contexts')
        client.loadEvents('src/events')
        await registerCommands()
        break
      default:
        await interaction.followUp({
          content: mina.say('dev.reload.error.invalidType'),
          ephemeral: true,
        })
        return
    }

    const embed = MinaEmbed.success()
      .setTitle(mina.say('dev.reload.success.title'))
      .setDescription(
        mina.sayf('dev.reload.success.description', { type: reloadType })
      )

    const backButton = MinaRows.backRow('dev:btn:back_reload')

    await interaction.editReply({
      embeds: [embed],
      components: [backButton],
    })
  } catch (error: any) {
    const errorEmbed = MinaEmbed.error()
      .setTitle(mina.say('dev.reload.error.title'))
      .setDescription(
        mina.sayf('dev.reload.error.description', {
          type: reloadType,
          error: error.message,
        })
      )

    const backButton = MinaRows.backRow('dev:btn:back_reload')

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [backButton],
    })
  }
}
