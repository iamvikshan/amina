import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { getUser, updateUserMinaAiPreferences } from '@schemas/User'
import { getAiConfig } from '@schemas/Dev'
import { MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

/**
 * Show settings menu for user preferences
 */
export async function showSettings(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  // Don't defer if already deferred (e.g., called from menu)
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate()
  }

  const userData = await getUser(interaction.user)
  const globalConfig = await getAiConfig()
  const prefs = userData.minaAi || {
    ignoreMe: false,
    allowDMs: true,
    combineDmWithServer: false,
    globalServerMemories: true,
  }

  const ignoreMeStatus = prefs.ignoreMe ? 'enabled' : 'disabled'
  const allowDMsStatus = prefs.allowDMs ? 'enabled' : 'disabled'
  const allowDMsNote = globalConfig.dmEnabledGlobally
    ? ''
    : ' (globally disabled by developers)'
  const combineStatus = prefs.combineDmWithServer ? 'enabled' : 'disabled'
  const globalMemoriesStatus =
    prefs.globalServerMemories !== false ? 'enabled' : 'disabled'

  const embed = MinaEmbed.primary()
    .setTitle('mina ai settings')
    .setDescription(
      'configure your mina ai preferences.\n\n' +
        `**ignore me:** ${ignoreMeStatus}\n` +
        `i will never respond to you if enabled.\n\n` +
        `**enable dm chat:** ${allowDMsStatus}${allowDMsNote}\n` +
        `allow me to respond in dms (requires global enable).\n\n` +
        `**combine dm memories with server:** ${combineStatus}\n` +
        `use dm memories when chatting in servers (and vice versa).\n\n` +
        `**use memories across all servers:** ${globalMemoriesStatus}\n` +
        `use memories from all servers, not just the current one.\n\n` +
        'select a setting to toggle it.'
    )
    .setFooter({ text: 'changes take effect immediately' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('minaai:menu:settings')
      .setPlaceholder('select a setting to toggle...')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('toggle ignore me')
          .setDescription(
            prefs.ignoreMe
              ? 'disable - allow me to respond to you'
              : 'enable - i will never respond to you'
          )
          .setValue('toggle_ignore'),
        new StringSelectMenuOptionBuilder()
          .setLabel('toggle enable dm chat')
          .setDescription(
            !globalConfig.dmEnabledGlobally
              ? 'globally disabled by developers'
              : prefs.allowDMs
                ? 'disable - block dm responses'
                : 'enable - allow dm responses'
          )
          .setValue('toggle_dms'),
        new StringSelectMenuOptionBuilder()
          .setLabel('toggle combine dm/server memories')
          .setDescription(
            prefs.combineDmWithServer
              ? 'disable - separate dm and server memories'
              : 'enable - combine dm and server memories'
          )
          .setValue('toggle_combine'),
        new StringSelectMenuOptionBuilder()
          .setLabel('toggle global server memories')
          .setDescription(
            prefs.globalServerMemories !== false
              ? 'disable - use only current server memories'
              : 'enable - use memories from all servers'
          )
          .setValue('toggle_global'),
        new StringSelectMenuOptionBuilder()
          .setLabel('forget me')
          .setDescription('delete all your memories and set ignore me')
          .setValue('forget'),
      ])
  )

  const backRow = MinaRows.backRow('minaai:btn:back')

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backRow],
  })
}

/**
 * Handle settings menu selection
 */
export async function handleSettingsMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const action = interaction.values[0]

  if (action === 'forget') {
    await interaction.deferUpdate()
    const { showForgetMeConfirmation } = await import('./forget-me')
    await showForgetMeConfirmation(interaction)
    return
  }

  await interaction.deferUpdate()

  const userData = await getUser(interaction.user)
  const globalConfig = await getAiConfig()
  const currentPrefs = userData.minaAi || {
    ignoreMe: false,
    allowDMs: true,
    combineDmWithServer: false,
    globalServerMemories: true,
  }

  let newPrefs = { ...currentPrefs }
  let updateMessage = ''

  switch (action) {
    case 'toggle_ignore': {
      newPrefs.ignoreMe = !currentPrefs.ignoreMe
      updateMessage = newPrefs.ignoreMe
        ? 'i will now ignore you. you can change this anytime in settings.'
        : 'i will now respond to you again!'
      break
    }
    case 'toggle_dms': {
      if (!globalConfig.dmEnabledGlobally) {
        const embed = MinaEmbed.error(
          'dm support is currently disabled globally by the bot developers.'
        )
        await interaction.editReply({
          embeds: [embed],
          components: [MinaRows.backRow('minaai:btn:back')],
        })
        return
      }
      newPrefs.allowDMs = !currentPrefs.allowDMs
      updateMessage = newPrefs.allowDMs
        ? 'dm chat enabled! i can now respond to you in dms.'
        : 'dm chat disabled. i will not respond in dms.'
      break
    }
    case 'toggle_combine': {
      newPrefs.combineDmWithServer = !currentPrefs.combineDmWithServer
      updateMessage = newPrefs.combineDmWithServer
        ? 'dm and server memories are now combined. i can use memories from both contexts.'
        : 'dm and server memories are now separated. i will only use memories from the current context.'
      break
    }
    case 'toggle_global': {
      newPrefs.globalServerMemories =
        currentPrefs.globalServerMemories === false
      updateMessage = newPrefs.globalServerMemories
        ? 'global server memories enabled! i can use memories from all servers.'
        : 'global server memories disabled. i will only use memories from the current server.'
      break
    }
  }

  // Update user preferences
  await updateUserMinaAiPreferences(interaction.user.id, newPrefs)

  const embed = MinaEmbed.success(`**setting updated!**\n\n${updateMessage}`)

  await interaction.editReply({
    embeds: [embed],
    components: [MinaRows.backRow('minaai:btn:back')],
  })

  // Refresh settings view after a short delay
  setTimeout(async () => {
    try {
      await showSettings(interaction)
    } catch (_error) {
      // User may have navigated away, ignore
    }
  }, 2000)
}
