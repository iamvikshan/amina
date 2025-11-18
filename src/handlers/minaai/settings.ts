import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getUser, updateUserMinaAiPreferences } from '@schemas/User'
import { getAiConfig } from '@schemas/Dev'
import { createSecondaryBtn } from '@helpers/componentHelper'
import { showMinaAiHub } from './main-hub'

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

  const ignoreMeStatus = prefs.ignoreMe ? '✅ Enabled' : '❌ Disabled'
  const allowDMsStatus = prefs.allowDMs ? '✅ Enabled' : '❌ Disabled'
  const allowDMsNote = globalConfig.dmEnabledGlobally
    ? ''
    : ' (Globally disabled by developers)'
  const combineStatus = prefs.combineDmWithServer ? '✅ Enabled' : '❌ Disabled'
  const globalMemoriesStatus =
    prefs.globalServerMemories !== false ? '✅ Enabled' : '❌ Disabled'

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('⚙️ Mina AI Settings')
    .setDescription(
      'Configure your Mina AI preferences.\n\n' +
        `**Ignore Me:** ${ignoreMeStatus}\n` +
        `I will never respond to you if enabled.\n\n` +
        `**Enable DM Chat:** ${allowDMsStatus}${allowDMsNote}\n` +
        `Allow me to respond in DMs (requires global enable).\n\n` +
        `**Combine DM Memories with Server:** ${combineStatus}\n` +
        `Use DM memories when chatting in servers (and vice versa).\n\n` +
        `**Use Memories Across All Servers:** ${globalMemoriesStatus}\n` +
        `Use memories from all servers, not just the current one.\n\n` +
        'Select a setting to toggle it.'
    )
    .setFooter({ text: 'Changes take effect immediately' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('minaai:menu:settings')
      .setPlaceholder('⚙️ Select a setting to toggle...')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Toggle Ignore Me')
          .setDescription(
            prefs.ignoreMe
              ? 'Disable - Allow me to respond to you'
              : 'Enable - I will never respond to you'
          )
          .setValue('toggle_ignore')
          .setEmoji(prefs.ignoreMe ? '👁️' : '🚫'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Toggle Enable DM Chat')
          .setDescription(
            !globalConfig.dmEnabledGlobally
              ? 'Globally disabled by developers'
              : prefs.allowDMs
                ? 'Disable - Block DM responses'
                : 'Enable - Allow DM responses'
          )
          .setValue('toggle_dms')
          .setEmoji('📬'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Toggle Combine DM/Server Memories')
          .setDescription(
            prefs.combineDmWithServer
              ? 'Disable - Separate DM and server memories'
              : 'Enable - Combine DM and server memories'
          )
          .setValue('toggle_combine')
          .setEmoji('🔗'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Toggle Global Server Memories')
          .setDescription(
            prefs.globalServerMemories !== false
              ? 'Disable - Use only current server memories'
              : 'Enable - Use memories from all servers'
          )
          .setValue('toggle_global')
          .setEmoji('🌐'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Forget Me')
          .setDescription('Delete all your memories and set ignore me')
          .setValue('forget')
          .setEmoji('🧹'),
      ])
  )

  const backButton = createSecondaryBtn({
    customId: 'minaai:btn:back',
    label: 'Back to Main Menu',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
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
        ? '🚫 I will now ignore you. You can change this anytime in Settings.'
        : '👁️ I will now respond to you again!'
      break
    }
    case 'toggle_dms': {
      if (!globalConfig.dmEnabledGlobally) {
        const embed = new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            '❌ DM support is currently disabled globally by the bot developers.'
          )
        await interaction.editReply({
          embeds: [embed],
          components: [
            createSecondaryBtn({
              customId: 'minaai:btn:back',
              label: 'Back to Main Menu',
              emoji: '◀️',
            }),
          ],
        })
        return
      }
      newPrefs.allowDMs = !currentPrefs.allowDMs
      updateMessage = newPrefs.allowDMs
        ? '📬 DM chat enabled! I can now respond to you in DMs.'
        : '📬 DM chat disabled. I will not respond in DMs.'
      break
    }
    case 'toggle_combine': {
      newPrefs.combineDmWithServer = !currentPrefs.combineDmWithServer
      updateMessage = newPrefs.combineDmWithServer
        ? '🔗 DM and server memories are now combined. I can use memories from both contexts.'
        : '🔗 DM and server memories are now separated. I will only use memories from the current context.'
      break
    }
    case 'toggle_global': {
      newPrefs.globalServerMemories =
        currentPrefs.globalServerMemories === false
      updateMessage = newPrefs.globalServerMemories
        ? '🌐 Global server memories enabled! I can use memories from all servers.'
        : '🌐 Global server memories disabled. I will only use memories from the current server.'
      break
    }
  }

  // Update user preferences
  await updateUserMinaAiPreferences(interaction.user.id, newPrefs)

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(`✅ **Setting Updated!**\n\n${updateMessage}`)

  await interaction.editReply({
    embeds: [embed],
    components: [
      createSecondaryBtn({
        customId: 'minaai:btn:back',
        label: 'Back to Settings',
        emoji: '◀️',
      }),
    ],
  })

  // Refresh settings view after a short delay
  setTimeout(async () => {
    try {
      await showSettings(interaction)
    } catch (error) {
      // User may have navigated away, ignore
    }
  }, 2000)
}
