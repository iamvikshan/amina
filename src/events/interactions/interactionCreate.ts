import { BaseInteraction, MessageFlags } from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { getUser } from '@schemas/User'
import {
  adminHandler,
  commandHandler,
  contextHandler,
  statsHandler,
  todHandler,
  reportHandler,
  guildHandler,
} from '@src/handlers'
import rolesHandler from '@handlers/roles'
import {
  handleTicketOpen,
  handleTicketClose,
} from '@handlers/ticket/shared/buttons'
import { parseCustomIdState } from '@helpers/componentHelper'
import type { BotClient } from '@src/structures'

export default async (
  client: BotClient,
  interaction: BaseInteraction
): Promise<void> => {
  // Check ignoreMe preference for /mina-ai command (works in both DMs and guilds)
  if (
    interaction.isChatInputCommand() &&
    interaction.commandName === 'mina-ai'
  ) {
    const userData = await getUser(interaction.user)
    if (userData.minaAi?.ignoreMe) {
      await interaction
        .reply({
          content: `I've been set to ignore you. You can change this in \`/mina-ai\` → Settings → Toggle "Ignore Me" off.`,
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {})
      return
    }
  }

  // Autocomplete
  if (interaction.isAutocomplete()) {
    const { handleAutocomplete } = await import('@handlers/autocomplete')
    await handleAutocomplete(interaction)
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
    // Route profile button interactions
    if (interaction.customId.startsWith('profile:btn:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'back') {
        const { handleProfileBackButton } = await import('@handlers/profile')
        await handleProfileBackButton(interaction)
        return
      } else if (action === 'clear_confirm') {
        const { handleClearConfirm } = await import('@handlers/profile')
        await handleClearConfirm(interaction)
        return
      } else if (action === 'clear_cancel') {
        const { handleClearCancel } = await import('@handlers/profile')
        await handleClearCancel(interaction)
        return
      } else if (action === 'edit_from_view') {
        const { showEditMenu } = await import('@handlers/profile')
        await interaction.deferUpdate()
        await showEditMenu(interaction)
        return
      }
    }
    // Route admin buttons
    if (interaction.customId.startsWith('admin:btn:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'back') {
        await adminHandler.handleAdminBackButton(interaction)
        return
      }
      if (action === 'back_minaai') {
        const { showMinaAIMenu } = await import('@handlers/admin/ai')
        await interaction.deferUpdate()
        await showMinaAIMenu(interaction as any)
        return
      }
    }

    // Route minaai buttons
    if (interaction.customId.startsWith('minaai:btn:')) {
      // Use parseCustomIdState to extract base action (handles pipe-delimited state)
      const { base } = parseCustomIdState(interaction.customId)
      const [, , action] = base.split(':')

      if (action === 'back') {
        const { handleMinaAiBackButton } = await import('@handlers/minaai')
        await handleMinaAiBackButton(interaction)
        return
      }
      if (action === 'forget_confirm') {
        const { handleForgetMeConfirm } = await import('@handlers/minaai')
        await handleForgetMeConfirm(interaction)
        return
      }
      if (action === 'forget_cancel') {
        const { handleForgetMeCancel } = await import('@handlers/minaai')
        await handleForgetMeCancel(interaction)
        return
      }
      if (action === 'category') {
        const { showCategoryDetailView } = await import('@handlers/minaai')
        await showCategoryDetailView(interaction)
        return
      }
      if (action === 'category_page') {
        const { handleCategoryPage } = await import('@handlers/minaai')
        await handleCategoryPage(interaction)
        return
      }
      if (action === 'back_memories') {
        const { handleBackToMemories } = await import('@handlers/minaai')
        await handleBackToMemories(interaction)
        return
      }
      if (action === 'dm_me' || action === 'dm_me_category') {
        const { handleDmMe } = await import('@handlers/minaai')
        await handleDmMe(interaction)
        return
      }
    }

    // Route reminder buttons
    if (interaction.customId.startsWith('reminder:btn:')) {
      const { base } = parseCustomIdState(interaction.customId)
      const [, , action] = base.split(':')

      if (action === 'back') {
        const { handleReminderBackButton } = await import('@handlers/reminder')
        await handleReminderBackButton(interaction)
        return
      }
      if (action === 'page') {
        const { handleReminderPage } = await import('@handlers/reminder')
        await handleReminderPage(interaction)
        return
      }
      if (action === 'clear_confirm') {
        const { handleClearConfirm } = await import('@handlers/reminder')
        await handleClearConfirm(interaction)
        return
      }
      if (action === 'clear_cancel') {
        const { handleClearCancel } = await import('@handlers/reminder')
        await handleClearCancel(interaction)
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
        const { showCleanupMethodMenu } =
          await import('@handlers/roles/cleanup/method-select')
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

    // Route purge buttons
    if (interaction.customId.startsWith('purge:btn:')) {
      // Use parseCustomIdState to extract base action (handles pipe-delimited state)
      const { base } = parseCustomIdState(interaction.customId)
      const [, , action] = base.split(':')

      if (action === 'back') {
        const { handlePurgeBackButton } = await import('@handlers/purge')
        await handlePurgeBackButton(interaction)
        return
      }
      if (action === 'confirm') {
        const { handlePurgeConfirm } = await import('@handlers/purge')
        await handlePurgeConfirm(interaction)
        return
      }
      if (action === 'cancel') {
        const { handlePurgeCancel } = await import('@handlers/purge')
        await handlePurgeCancel(interaction)
        return
      }
      if (action === 'use_current') {
        const { handleUseCurrentChannel } = await import('@handlers/purge')
        await handleUseCurrentChannel(interaction)
        return
      }
      if (action === 'proceed_type') {
        const { handleProceedType } = await import('@handlers/purge')
        await handleProceedType(interaction)
        return
      }
      if (action === 'proceed_amount') {
        // Parse state from custom_id and proceed to channel selection
        const customId = interaction.customId
        const parts = customId.split('|')
        const typePart = parts.find(p => p.startsWith('type:'))
        const amountPart = parts.find(p => p.startsWith('amount:'))
        const tokenPart = parts.find(p => p.startsWith('token:'))
        const userPart = parts.find(p => p.startsWith('user:'))

        const purgeType = typePart?.split(':')[1] as any
        const amount = parseInt(amountPart?.split(':')[1] || '100', 10)
        const token = tokenPart
          ? Buffer.from(tokenPart.split(':')[1], 'base64').toString()
          : undefined
        const userId = userPart?.split(':')[1]

        await interaction.deferUpdate()
        const { showChannelSelect } =
          await import('@handlers/purge/parameters/channel-select')
        await showChannelSelect(
          interaction,
          purgeType,
          amount,
          { token, userId },
          false
        ) // isManualSelection = false (default flow)
        return
      }
      if (action === 'proceed_channel') {
        const { handleProceedChannel } = await import('@handlers/purge')
        await handleProceedChannel(interaction)
        return
      }
    }

    // Route dev buttons
    if (interaction.customId.startsWith('dev:btn:')) {
      const [, , action] = interaction.customId.split(':')

      if (action === 'back') {
        const { handleDevBackButton } = await import('@handlers/dev')
        await handleDevBackButton(interaction)
        return
      }
      if (
        action === 'back_tod' ||
        action === 'back_reload' ||
        action === 'back_trig' ||
        action === 'back_listservers' ||
        action === 'back_leaveserver' ||
        action === 'back_presence' ||
        action === 'back_minaai'
      ) {
        const { handleDevBackButton } = await import('@handlers/dev')
        await handleDevBackButton(interaction)
        return
      }
      if (action === 'back_minaai_menu') {
        const { showMinaAiMenu } = await import('@handlers/dev/minaai')
        await interaction.deferUpdate()
        await showMinaAiMenu(interaction)
        return
      }
      if (action === 'presence_start') {
        const { showPresenceModal } = await import('@handlers/dev/presence')
        await showPresenceModal(interaction)
        return
      }
      if (action.startsWith('presence_confirm')) {
        const { handlePresenceConfirm } = await import('@handlers/dev/presence')
        await handlePresenceConfirm(interaction)
        return
      }
      if (action === 'trig_confirm') {
        const { handleTrigSettingsConfirm } =
          await import('@handlers/dev/trig-settings')
        await handleTrigSettingsConfirm(interaction)
        return
      }
      if (action.startsWith('listservers_page')) {
        const { handleListserversPage } = await import('@handlers/dev')
        await handleListserversPage(interaction)
        return
      }
    }

    // Route ticket buttons
    if (interaction.customId.startsWith('ticket:btn:')) {
      const [, , action] = interaction.customId.split(':')

      if (action === 'back') {
        const { handleTicketBackButton } =
          await import('@handlers/ticket/main-hub')
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
        const { handleBackToTopics } =
          await import('@handlers/ticket/setup/topics')
        await handleBackToTopics(interaction)
        return
      }
      if (action === 'closeall_confirm') {
        const { handleCloseAllConfirm } =
          await import('@handlers/ticket/manage/close-all')
        await handleCloseAllConfirm(interaction)
        return
      }
      if (action === 'closeall_cancel') {
        const { handleCloseAllCancel } =
          await import('@handlers/ticket/manage/close-all')
        await handleCloseAllCancel(interaction)
        return
      }
      if (action?.startsWith('topic_remove_confirm')) {
        const { handleRemoveTopicConfirm } =
          await import('@handlers/ticket/setup/topics')
        await handleRemoveTopicConfirm(interaction)
        return
      }
      if (action === 'topic_remove_cancel') {
        const { handleRemoveTopicCancel } =
          await import('@handlers/ticket/setup/topics')
        await handleRemoveTopicCancel(interaction)
        return
      }
      // Handle delete button - custom_id format: ticket:btn:delete|ch:${channelId}
      // Split by : gives ['ticket', 'btn', 'delete|ch', 'channelId'], so check if action starts with 'delete'
      if (action?.startsWith('delete')) {
        const { handleTicketDelete } =
          await import('@handlers/ticket/shared/buttons')
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
        const { handleTicketMessageModal } =
          await import('@handlers/ticket/setup/message')
        await handleTicketMessageModal(interaction)
        return
      }
      if (action === 'limit') {
        const { handleLimitModal } =
          await import('@handlers/ticket/setup/limit')
        await handleLimitModal(interaction)
        return
      }
      if (action === 'topic_add') {
        const { handleAddTopicModal } =
          await import('@handlers/ticket/setup/topics')
        await handleAddTopicModal(interaction)
        return
      }
    }

    // Route purge modals
    if (interaction.customId.startsWith('purge:modal:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'token') {
        const { handleTokenModal } = await import('@handlers/purge')
        await handleTokenModal(interaction)
        return
      }
      if (action === 'amount') {
        const { handleAmountModal } = await import('@handlers/purge')
        await handleAmountModal(interaction)
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

    // Route dev modals
    if (interaction.customId.startsWith('dev:modal:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'presence') {
        const { handlePresenceModal } = await import('@handlers/dev/presence')
        await handlePresenceModal(interaction)
        return
      }
      if (action === 'tod_add') {
        const { handleAddTodModal } = await import('@handlers/dev/tod')
        await handleAddTodModal(interaction)
        return
      }
      if (action === 'tod_remove') {
        const { handleRemoveTodModal } = await import('@handlers/dev/tod')
        await handleRemoveTodModal(interaction)
        return
      }
      if (action === 'leaveserver') {
        const { handleLeaveServerModal } = await import('@handlers/dev')
        await handleLeaveServerModal(interaction)
        return
      }
      if (action.startsWith('minaai_')) {
        const { handleMinaAiModal } = await import('@handlers/dev/minaai')
        await handleMinaAiModal(interaction)
        return
      }
    }

    // Route reminder modals
    if (interaction.customId.startsWith('reminder:modal:')) {
      const { parseCustomIdState } = await import('@helpers/componentHelper')
      const { base } = parseCustomIdState(interaction.customId)
      const [, , action] = base.split(':')

      if (action === 'edit_msg') {
        const { handleEditMessageModal } = await import('@handlers/reminder')
        await handleEditMessageModal(interaction)
        return
      }
      if (action === 'edit_time') {
        const { handleEditTimeModal } = await import('@handlers/reminder')
        await handleEditTimeModal(interaction)
        return
      }
    }

    switch (interaction.customId) {
      case 'AMINA_SETUP_MODAL':
        await guildHandler.handleSetupModal(interaction)
        return
      case 'AMINA_REMIND_MODAL':
        await guildHandler.handleRemindModal(interaction)
        return
      case 'profile_set_basic_modal':
      case 'profile_set_misc_modal': {
        const { handleProfileModal } = await import('@handlers/profile')
        await handleProfileModal(interaction)
        return
      }
      default:
        if (interaction.customId.startsWith('report_modal_')) {
          await reportHandler.handleReportModal(interaction)
        }
    }
    return
  }

  // Select menus
  if (interaction.isStringSelectMenu()) {
    // Route dev component interactions
    if (interaction.customId.startsWith('dev:menu:')) {
      const [, , submenu] = interaction.customId.split(':')
      if (submenu === 'category') {
        const { handleCategoryMenu } = await import('@handlers/dev')
        await handleCategoryMenu(interaction)
        return
      }
      if (submenu === 'tod') {
        const { handleTodMenu } = await import('@handlers/dev/tod')
        await handleTodMenu(interaction)
        return
      }
      if (submenu === 'reload_type') {
        const { handleReloadType } = await import('@handlers/dev/reload')
        await handleReloadType(interaction)
        return
      }
      if (submenu === 'presence_type') {
        const { handlePresenceTypeMenu } =
          await import('@handlers/dev/presence')
        await handlePresenceTypeMenu(interaction)
        return
      }
      if (submenu === 'presence_status') {
        const { handlePresenceStatusMenu } =
          await import('@handlers/dev/presence')
        await handlePresenceStatusMenu(interaction)
        return
      }
      if (submenu === 'minaai') {
        const { handleMinaAiMenu } = await import('@handlers/dev/minaai')
        await handleMinaAiMenu(interaction)
        return
      }
      if (submenu.startsWith('minaai_')) {
        const operation = submenu.replace('minaai_', '')
        const { handleMinaAiToggle } = await import('@handlers/dev/minaai')
        await handleMinaAiToggle(interaction, operation)
        return
      }
    }

    // Route minaai component interactions
    if (interaction.customId.startsWith('minaai:')) {
      const [, type, submenu] = interaction.customId.split(':')
      if (type === 'menu') {
        if (submenu === 'operation') {
          const { handleMinaAiOperationMenu } = await import('@handlers/minaai')
          await handleMinaAiOperationMenu(interaction)
        } else if (submenu === 'settings') {
          const { handleSettingsMenu } = await import('@handlers/minaai')
          await handleSettingsMenu(interaction)
        }
        return
      }
    }

    // Route reminder component interactions
    if (interaction.customId.startsWith('reminder:')) {
      const [, type, submenu] = interaction.customId.split(':')
      if (type === 'menu') {
        if (submenu === 'operation') {
          const { handleReminderOperationMenu } =
            await import('@handlers/reminder')
          await handleReminderOperationMenu(interaction)
        } else if (submenu === 'delete') {
          const { handleDeleteReminderMenu } =
            await import('@handlers/reminder')
          await handleDeleteReminderMenu(interaction)
        } else if (submenu === 'edit') {
          const { handleEditReminderMenu } = await import('@handlers/reminder')
          await handleEditReminderMenu(interaction)
        } else if (submenu === 'edit_action') {
          const { handleEditActionMenu } = await import('@handlers/reminder')
          await handleEditActionMenu(interaction)
        }
        return
      }
    }

    // Route ticket component interactions
    if (interaction.customId.startsWith('ticket:')) {
      const [, type, submenu] = interaction.customId.split(':')
      if (type === 'menu') {
        if (submenu === 'category') {
          const { handleTicketCategoryMenu } =
            await import('@handlers/ticket/main-hub')
          await handleTicketCategoryMenu(interaction)
        } else if (submenu === 'setup') {
          const { handleSetupMenu } =
            await import('@handlers/ticket/setup/menu')
          await handleSetupMenu(interaction)
        } else if (submenu === 'manage') {
          const { handleManageMenu } =
            await import('@handlers/ticket/manage/menu')
          await handleManageMenu(interaction)
        } else if (submenu === 'topics') {
          const { handleTopicsMenu } =
            await import('@handlers/ticket/setup/topics')
          await handleTopicsMenu(interaction)
        } else if (submenu === 'topic_remove') {
          const { handleRemoveTopicSelect } =
            await import('@handlers/ticket/setup/topics')
          await handleRemoveTopicSelect(interaction)
        }
        return
      }
    }

    // Route admin component interactions
    if (interaction.customId.startsWith('admin:')) {
      const [, type] = interaction.customId.split(':')
      switch (type) {
        case 'menu': {
          const [, , submenu] = interaction.customId.split(':')
          if (submenu === 'category') {
            await adminHandler.handleAdminCategoryMenu(interaction)
          } else if (submenu === 'settings') {
            await adminHandler.handleServerSettingsMenu(interaction)
          } else if (submenu === 'minaai') {
            await adminHandler.handleMinaAIMenu(interaction)
          } else if (submenu === 'logs') {
            await adminHandler.handleLoggingMenu(interaction)
          } else if (submenu === 'remove_freewill') {
            const { handleRemoveFreeWillChannel } =
              await import('@handlers/admin/ai')
            await handleRemoveFreeWillChannel(interaction)
          }
          return
        }
      }
    }

    // Route purge component interactions
    if (interaction.customId.startsWith('purge:')) {
      const [, type, submenu] = interaction.customId.split(':')
      if (type === 'menu') {
        if (submenu === 'type') {
          const { handlePurgeTypeMenu } = await import('@handlers/purge')
          await handlePurgeTypeMenu(interaction)
        } else if (submenu.startsWith('amount')) {
          const { handleAmountSelect } = await import('@handlers/purge')
          await handleAmountSelect(interaction)
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

    // Route profile component interactions
    if (interaction.customId.startsWith('profile:')) {
      const [, type, submenu] = interaction.customId.split(':')
      if (type === 'menu') {
        if (submenu === 'operation') {
          const { handleProfileOperationMenu } =
            await import('@handlers/profile')
          await handleProfileOperationMenu(interaction)
        } else if (submenu === 'edit') {
          const { handleEditMenu } = await import('@handlers/profile')
          await handleEditMenu(interaction)
        } else if (submenu === 'privacy') {
          const { handlePrivacyMenu } = await import('@handlers/profile')
          await handlePrivacyMenu(interaction)
        }
        return
      }
    }

    // Legacy profile clear (kept for backward compatibility)
    switch (interaction.customId) {
      case 'profile_clear_confirm': {
        const { handleProfileClearLegacy } = await import('@handlers/profile')
        await handleProfileClearLegacy(interaction)
        return
      }
    }
    return
  }

  // Channel select menus
  if (interaction.isChannelSelectMenu()) {
    if (interaction.customId.startsWith('dev:channel:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'trig_settings') {
        const { handleTrigSettingsChannelSelect } =
          await import('@handlers/dev/trig-settings')
        await handleTrigSettingsChannelSelect(interaction)
        return
      }
    }
    if (interaction.customId.startsWith('purge:channel:')) {
      const { handleChannelSelect } = await import('@handlers/purge')
      await handleChannelSelect(interaction)
      return
    }
    if (interaction.customId.startsWith('ticket:channel:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'message') {
        const { handleMessageChannelSelect } =
          await import('@handlers/ticket/setup/message')
        await handleMessageChannelSelect(interaction)
      } else if (action === 'log') {
        const { handleLogChannelSelect } =
          await import('@handlers/ticket/setup/log-channel')
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
    if (interaction.customId === 'purge:user:select') {
      const { handleUserSelect } = await import('@handlers/purge')
      await handleUserSelect(interaction)
      return
    }
    if (interaction.customId.startsWith('ticket:user:')) {
      const [, , action] = interaction.customId.split(':')
      if (action === 'add') {
        const { handleAddUserSelect } =
          await import('@handlers/ticket/manage/add-user')
        await handleAddUserSelect(interaction)
      } else if (action === 'remove') {
        const { handleRemoveUserSelect } =
          await import('@handlers/ticket/manage/remove-user')
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

  // Track stats for all other interactions (skip in DMs)
  if (interaction.isRepliable() && interaction.guild) {
    const settings = await getSettings(interaction.guild)
    if (settings.stats.enabled) {
      statsHandler.trackInteractionStats(interaction as any).catch(() => {})
    }
  }
}
