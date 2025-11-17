import { BaseInteraction, MessageFlags } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import {
  adminHandler,
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
import rolesHandler from '@handlers/roles'
import {
  handleTicketOpen,
  handleTicketClose,
} from '@handlers/ticket/shared/buttons'
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
    // Route admin buttons
    if (interaction.customId.startsWith('admin:btn:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'back') {
        await adminHandler.handleAdminBackButton(interaction)
        return
      }
    }

    // Route roles buttons
    if (interaction.customId.startsWith('roles:btn:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'back') {
        await rolesHandler.handleRolesBackButton(interaction)
        return
      }
      if (action === 'back_cleanup') {
        // Import dynamically to show cleanup method menu
        const { showCleanupMethodMenu } = await import(
          '@handlers/roles/cleanup/method-select'
        )
        await interaction.deferUpdate()
        await showCleanupMethodMenu(interaction as any)
        return
      }
      if (action === 'confirm') {
        await rolesHandler.handleCleanupConfirm(interaction)
        return
      }
      if (action === 'cancel') {
        await rolesHandler.handleCleanupCancel(interaction)
        return
      }
      if (action === 'continue') {
        await rolesHandler.handleContinueButton(interaction)
        return
      }
      if (action === 'autorole_enable') {
        await rolesHandler.handleAutoroleEnableButton(interaction)
        return
      }
      if (action === 'autorole_disable') {
        await rolesHandler.handleAutoroleDisableButton(interaction)
        return
      }
      if (action === 'autorole_disable_confirm') {
        await rolesHandler.handleAutoroleDisableConfirm(interaction)
        return
      }
      if (action === 'autorole_cancel') {
        await rolesHandler.handleAutoroleCancel(interaction)
        return
      }
      // Create role buttons
      if (action === 'create_basic') {
        const { showCreateRoleModal } = await import('@handlers/roles/create')
        await showCreateRoleModal(interaction, false)
        return
      }
      if (action === 'create_advanced') {
        const { showCreateRoleModal } = await import('@handlers/roles/create')
        await showCreateRoleModal(interaction, true)
        return
      }
      // Add to user confirm button (encoded data in custom_id)
      if (action.startsWith('assign_confirm')) {
        await rolesHandler.handleAssignConfirm(interaction)
        return
      }
    }

    // Route ticket buttons
    if (interaction.customId.startsWith('ticket:btn:')) {
      const [, , action, ...rest] = interaction.customId.split(':')

      if (action === 'back') {
        const { handleTicketBackButton } = await import(
          '@handlers/ticket/main-hub'
        )
        await handleTicketBackButton(interaction)
        return
      }
      if (action === 'back_setup') {
        const { showSetupMenu } = await import('@handlers/ticket/setup/menu')
        await interaction.deferUpdate()
        await showSetupMenu(interaction as any)
        return
      }
      if (action === 'back_manage') {
        const { showManageMenu } = await import('@handlers/ticket/manage/menu')
        await interaction.deferUpdate()
        await showManageMenu(interaction as any)
        return
      }
      if (action === 'back_topics') {
        const { handleBackToTopics } = await import(
          '@handlers/ticket/setup/topics'
        )
        await handleBackToTopics(interaction)
        return
      }
      if (action === 'closeall_confirm') {
        const { handleCloseAllConfirm } = await import(
          '@handlers/ticket/manage/close-all'
        )
        await handleCloseAllConfirm(interaction)
        return
      }
      if (action === 'closeall_cancel') {
        const { handleCloseAllCancel } = await import(
          '@handlers/ticket/manage/close-all'
        )
        await handleCloseAllCancel(interaction)
        return
      }
      if (action === 'topic_remove_confirm') {
        const { handleRemoveTopicConfirm } = await import(
          '@handlers/ticket/setup/topics'
        )
        await handleRemoveTopicConfirm(interaction)
        return
      }
      if (action === 'topic_remove_cancel') {
        const { handleRemoveTopicCancel } = await import(
          '@handlers/ticket/setup/topics'
        )
        await handleRemoveTopicCancel(interaction)
        return
      }
      // Handle delete button - custom_id format: ticket:btn:delete|ch:${channelId}
      // Split by : gives ['ticket', 'btn', 'delete|ch', 'channelId'], so check if action starts with 'delete'
      if (action?.startsWith('delete')) {
        const { handleTicketDelete } = await import(
          '@handlers/ticket/shared/buttons'
        )
        await handleTicketDelete(interaction)
        return
      }
    }

    switch (interaction.customId) {
      case 'TICKET_CREATE':
        await handleTicketOpen(interaction)
        return
      case 'TICKET_CLOSE':
        await handleTicketClose(interaction)
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
    // Route ticket modals
    if (interaction.customId.startsWith('ticket:modal:')) {
      const [, , action] = interaction.customId.split(':')
      if (action.startsWith('message')) {
        const { handleTicketMessageModal } = await import(
          '@handlers/ticket/setup/message'
        )
        await handleTicketMessageModal(interaction)
        return
      }
      if (action === 'limit') {
        const { handleLimitModal } = await import(
          '@handlers/ticket/setup/limit'
        )
        await handleLimitModal(interaction)
        return
      }
      if (action === 'topic_add') {
        const { handleAddTopicModal } = await import(
          '@handlers/ticket/setup/topics'
        )
        await handleAddTopicModal(interaction)
        return
      }
    }

    // Route roles modals
    if (interaction.customId.startsWith('roles:modal:')) {
      const [, , action] = interaction.customId.split(':')
      if (action.startsWith('create')) {
        // Create role modal
        await rolesHandler.handleCreateRoleModal(interaction)
      } else {
        // Cleanup modals (prefix, position, older)
        await rolesHandler.handleCleanupModal(interaction)
      }
      return
    }

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
    // Route ticket component interactions
    if (interaction.customId.startsWith('ticket:')) {
      const [, type, submenu] = interaction.customId.split(':')
      if (type === 'menu') {
        if (submenu === 'category') {
          const { handleTicketCategoryMenu } = await import(
            '@handlers/ticket/main-hub'
          )
          await handleTicketCategoryMenu(interaction)
        } else if (submenu === 'setup') {
          const { handleSetupMenu } = await import(
            '@handlers/ticket/setup/menu'
          )
          await handleSetupMenu(interaction)
        } else if (submenu === 'manage') {
          const { handleManageMenu } = await import(
            '@handlers/ticket/manage/menu'
          )
          await handleManageMenu(interaction)
        } else if (submenu === 'topics') {
          const { handleTopicsMenu } = await import(
            '@handlers/ticket/setup/topics'
          )
          await handleTopicsMenu(interaction)
        } else if (submenu === 'topic_remove') {
          const { handleRemoveTopicSelect } = await import(
            '@handlers/ticket/setup/topics'
          )
          await handleRemoveTopicSelect(interaction)
        }
        return
      }
    }

    // Route admin component interactions
    if (interaction.customId.startsWith('admin:')) {
      const [, type] = interaction.customId.split(':')
      switch (type) {
        case 'menu':
          const [, , submenu] = interaction.customId.split(':')
          if (submenu === 'category') {
            await adminHandler.handleAdminCategoryMenu(interaction)
          } else if (submenu === 'settings') {
            await adminHandler.handleServerSettingsMenu(interaction)
          } else if (submenu === 'minaai') {
            await adminHandler.handleMinaAIMenu(interaction)
          } else if (submenu === 'logs') {
            await adminHandler.handleLoggingMenu(interaction)
          }
          return
      }
    }

    // Route roles component interactions
    if (interaction.customId.startsWith('roles:')) {
      const [, type, submenu] = interaction.customId.split(':')
      if (type === 'menu') {
        if (submenu === 'operation') {
          await rolesHandler.handleRolesOperationMenu(interaction)
        } else if (submenu === 'cleanup_method') {
          await rolesHandler.handleCleanupMethodMenu(interaction)
        } else if (submenu.startsWith('perms')) {
          // Permission preset selection (create role)
          await rolesHandler.handlePermissionSelect(interaction)
        }
        return
      }
    }

    switch (interaction.customId) {
      case 'profile_clear_confirm':
        await profileHandler.handleProfileClear(interaction)
        return
    }
    return
  }

  // Channel select menus
  if (interaction.isChannelSelectMenu()) {
    if (interaction.customId.startsWith('ticket:channel:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'message') {
        const { handleMessageChannelSelect } = await import(
          '@handlers/ticket/setup/message'
        )
        await handleMessageChannelSelect(interaction)
      } else if (action === 'log') {
        const { handleLogChannelSelect } = await import(
          '@handlers/ticket/setup/log-channel'
        )
        await handleLogChannelSelect(interaction)
      }
      return
    }
    if (interaction.customId.startsWith('admin:channel:')) {
      await adminHandler.handleChannelSelect(interaction)
      return
    }
    return
  }

  // User select menus
  if (interaction.isUserSelectMenu()) {
    if (interaction.customId.startsWith('ticket:user:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'add') {
        const { handleAddUserSelect } = await import(
          '@handlers/ticket/manage/add-user'
        )
        await handleAddUserSelect(interaction)
      } else if (action === 'remove') {
        const { handleRemoveUserSelect } = await import(
          '@handlers/ticket/manage/remove-user'
        )
        await handleRemoveUserSelect(interaction)
      }
      return
    }
    if (interaction.customId === 'roles:user:select') {
      await rolesHandler.handleUserSelect(interaction)
      return
    }
    return
  }

  // Role select menus
  if (interaction.isRoleSelectMenu()) {
    if (interaction.customId.startsWith('admin:role:')) {
      await adminHandler.handleRoleSelect(interaction)
      return
    }
    if (interaction.customId.startsWith('roles:role:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'autorole_select') {
        await rolesHandler.handleAutoroleRoleSelect(interaction)
      } else if (action.startsWith('assign')) {
        // Add to user role selection (contains encoded user data)
        await rolesHandler.handleRoleSelect(interaction)
      } else {
        // Cleanup role keep selection
        await rolesHandler.handleRoleKeepSelect(interaction)
      }
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
