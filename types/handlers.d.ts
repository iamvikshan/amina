// Handler type definitions

import type {
  StringSelectMenuInteraction,
  ChannelSelectMenuInteraction,
  RoleSelectMenuInteraction,
  UserSelectMenuInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  Role,
} from 'discord.js'

declare global {
  type PurgeType = 'all' | 'attachments' | 'bots' | 'links' | 'token' | 'user'
}

// Admin handler types
declare module '@handlers/admin' {
  export interface AdminHandlers {
    handleAdminCategoryMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleServerSettingsMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleMinaAIMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleLoggingMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleChannelSelect: (interaction: ChannelSelectMenuInteraction) => Promise<void>
    handleRoleSelect: (interaction: RoleSelectMenuInteraction) => Promise<void>
    handleAdminBackButton: (interaction: ButtonInteraction) => Promise<void>
  }

  export type AdminMenuAction =
    | 'settings'
    | 'minaai'
    | 'logs'
    | 'status'
    | 'back'
    | 'updateschannel'
    | 'staffadd'
    | 'staffremove'
    | 'toggle'
    | 'freewill'
    | 'mentiononly'
    | 'dms'
    | 'setchannel'
    | 'toggleall'

  export type AdminChannelSelectType = 'updateschannel' | 'freewill' | 'logchannel'
  export type AdminRoleSelectType = 'staffadd' | 'staffremove'
}

// Role handler types
declare module '@handlers/roles' {
  export interface RoleCleanupStats {
    matched: Role[]
    deletable: Role[]
    skipped: Array<{ role: Role; reason: string }>
  }

  export type RoleCleanupMethod = 'empty' | 'prefix' | 'below' | 'older'

  export interface RoleCleanupParams {
    method: RoleCleanupMethod
    prefix?: string
    position?: number
    days?: number
    keepIds?: Set<string>
  }

  export interface RoleHandlers {
    handleRolesOperationMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleRolesCleanupMethodMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleRolesBackButton: (interaction: ButtonInteraction) => Promise<void>
    handleRoleCleanupModal: (interaction: ModalSubmitInteraction) => Promise<void>
    handleRoleCleanupKeepSelect: (interaction: RoleSelectMenuInteraction) => Promise<void>
    handleRoleCleanupConfirm: (interaction: ButtonInteraction) => Promise<void>
    handleRoleCleanupCancel: (interaction: ButtonInteraction) => Promise<void>
  }

  export type RoleOperation = 'cleanup' | 'create' | 'autorole' | 'add2user'
}

// Ticket handler types
declare module '@handlers/ticket' {
  export interface TicketHandlers {
    handleTicketCategoryMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleTicketBackButton: (interaction: ButtonInteraction) => Promise<void>
    handleSetupMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleManageMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleTopicsMenu: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleMessageChannelSelect: (interaction: ChannelSelectMenuInteraction) => Promise<void>
    handleLogChannelSelect: (interaction: ChannelSelectMenuInteraction) => Promise<void>
    handleTicketMessageModal: (interaction: ModalSubmitInteraction) => Promise<void>
    handleLimitModal: (interaction: ModalSubmitInteraction) => Promise<void>
    handleAddTopicModal: (interaction: ModalSubmitInteraction) => Promise<void>
    handleRemoveTopicSelect: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleRemoveTopicConfirm: (interaction: ButtonInteraction) => Promise<void>
    handleRemoveTopicCancel: (interaction: ButtonInteraction) => Promise<void>
    handleBackToTopics: (interaction: ButtonInteraction) => Promise<void>
    handleCloseTicket: (interaction: StringSelectMenuInteraction) => Promise<void>
    handleCloseAllConfirm: (interaction: ButtonInteraction) => Promise<void>
    handleCloseAllCancel: (interaction: ButtonInteraction) => Promise<void>
    handleAddUserSelect: (interaction: UserSelectMenuInteraction) => Promise<void>
    handleRemoveUserSelect: (interaction: UserSelectMenuInteraction) => Promise<void>
  }

  export type TicketCategory = 'setup' | 'manage'
  export type TicketSetupOption = 'message' | 'log' | 'limit' | 'topics'
  export type TicketManageOption = 'close' | 'closeall' | 'add' | 'remove'
  export type TicketTopicsOption = 'list' | 'add' | 'remove'
}

export {}

