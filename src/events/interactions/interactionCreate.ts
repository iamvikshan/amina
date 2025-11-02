import { BaseInteraction, MessageFlags } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import {
  commandHandler,
  contextHandler,
  statsHandler,
  suggestionHandler,
  ticketHandler,
  todHandler,
  reportHandler,
  guildHandler,
  profileHandler,
} from '@src/handlers'
import type { BotClient } from '@src/structures'

export default async (
  client: BotClient,
  interaction: BaseInteraction
): Promise<void> => {
  if (!interaction.guild) {
    if (interaction.isRepliable()) {
      await interaction
        .reply({
          content: 'Command can only be executed in a discord server',
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {})
    }
    return
  }

  // Slash Commands
  if (interaction.isChatInputCommand()) {
    await commandHandler.handleSlashCommand(interaction)
    return
  }

  // Context Menu
  if (interaction.isContextMenuCommand()) {
    const context = client.contextMenus.get(interaction.commandName)
    if (context) {
      await contextHandler.handleContext(interaction, context)
    } else {
      await interaction
        .reply({
          content: 'An error has occurred',
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {})
    }
    return
  }

  // Buttons
  if (interaction.isButton()) {
    switch (interaction.customId) {
      case 'TICKET_CREATE':
        await ticketHandler.handleTicketOpen(interaction)
        return
      case 'TICKET_CLOSE':
        await ticketHandler.handleTicketClose(interaction)
        return
      case 'SUGGEST_APPROVE':
        await suggestionHandler.handleApproveBtn(interaction)
        return
      case 'SUGGEST_REJECT':
        await suggestionHandler.handleRejectBtn(interaction)
        return
      case 'SUGGEST_DELETE':
        await suggestionHandler.handleDeleteBtn(interaction)
        return
      case 'truthBtn':
        await todHandler.handleTodButtonClick(interaction)
        return
      case 'dareBtn':
        await todHandler.handleTodButtonClick(interaction)
        return
      case 'randomBtn':
        await todHandler.handleTodButtonClick(interaction)
        return
      case 'AMINA_SETUP':
        await guildHandler.handleSetupButton(interaction)
        return
      case 'AMINA_REMIND':
        await guildHandler.handleRemindButton(interaction)
        return
    }
    return
  }

  // Modals
  if (interaction.isModalSubmit()) {
    switch (interaction.customId) {
      case 'SUGGEST_APPROVE_MODAL':
        await suggestionHandler.handleApproveModal(interaction)
        return
      case 'SUGGEST_REJECT_MODAL':
        await suggestionHandler.handleRejectModal(interaction)
        return
      case 'SUGGEST_DELETE_MODAL':
        await suggestionHandler.handleDeleteModal(interaction)
        return
      case 'AMINA_SETUP_MODAL':
        await guildHandler.handleSetupModal(interaction)
        return
      case 'AMINA_REMIND_MODAL':
        await guildHandler.handleRemindModal(interaction)
        return
      case 'profile_set_basic_modal':
      case 'profile_set_misc_modal':
        await profileHandler.handleProfileModal(interaction)
        return
      default:
        if (interaction.customId.startsWith('report_modal_')) {
          await reportHandler.handleReportModal(interaction)
        }
    }
    return
  }

  // Select menus
  if (interaction.isStringSelectMenu()) {
    switch (interaction.customId) {
      case 'profile_clear_confirm':
        await profileHandler.handleProfileClear(interaction)
        return
    }
    return
  }

  // Track stats for all other interactions
  if (interaction.isRepliable()) {
    const settings = await getSettings(interaction.guild)
    if (settings.stats.enabled) {
      statsHandler.trackInteractionStats(interaction as any).catch(() => {})
    }
  }
}
