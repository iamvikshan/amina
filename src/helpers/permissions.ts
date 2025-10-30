/**
 * Mapping of Discord permission flags to human-readable names
 */

// Individual named exports for each permission (for import * as compatibility)
export const AddReactions = 'Add Reactions'
export const Administrator = 'Administrator'
export const AttachFiles = 'Attach files'
export const BanMembers = 'Ban members'
export const ChangeNickname = 'Change nickname'
export const Connect = 'Connect'
export const CreateInstantInvite = 'Create instant invite'
export const CreatePrivateThreads = 'Create private threads'
export const CreatePublicThreads = 'Create public threads'
export const DeafenMembers = 'Deafen members'
export const EmbedLinks = 'Embed links'
export const KickMembers = 'Kick members'
export const ManageChannels = 'Manage channels'
export const ManageEmojisAndStickers = 'Manage emojis and stickers'
export const ManageEvents = 'Manage Events'
export const ManageGuild = 'Manage server'
export const ManageMessages = 'Manage messages'
export const ManageNicknames = 'Manage nicknames'
export const ManageRoles = 'Manage roles'
export const ManageThreads = 'Manage Threads'
export const ManageWebhooks = 'Manage webhooks'
export const MentionEveryone = 'Mention everyone'
export const ModerateMembers = 'Moderate Members'
export const MoveMembers = 'Move members'
export const MuteMembers = 'Mute members'
export const PrioritySpeaker = 'Priority speaker'
export const ReadMessageHistory = 'Read message history'
export const RequestToSpeak = 'Request to Speak'
export const SendMessages = 'Send messages'
export const SendMessagesInThreads = 'Send Messages In Threads'
export const SendTTSMessages = 'Send TTS messages'
export const Speak = 'Speak'
export const Stream = 'Video'
export const UseApplicationCommands = 'Use Application Commands'
export const UseEmbeddedActivities = 'Use Embedded Activities'
export const UseExternalEmojis = 'Use External Emojis'
export const UseExternalStickers = 'Use External Stickers'
export const UseVAD = 'Use voice activity'
export const ViewAuditLog = 'View audit log'
export const ViewChannel = 'View channel'
export const ViewGuildInsights = 'View server insights'

// Permissions object for backwards compatibility and convenience
const permissions = {
  AddReactions,
  Administrator,
  AttachFiles,
  BanMembers,
  ChangeNickname,
  Connect,
  CreateInstantInvite,
  CreatePrivateThreads,
  CreatePublicThreads,
  DeafenMembers,
  EmbedLinks,
  KickMembers,
  ManageChannels,
  ManageEmojisAndStickers,
  ManageEvents,
  ManageGuild,
  ManageMessages,
  ManageNicknames,
  ManageRoles,
  ManageThreads,
  ManageWebhooks,
  MentionEveryone,
  ModerateMembers,
  MoveMembers,
  MuteMembers,
  PrioritySpeaker,
  ReadMessageHistory,
  RequestToSpeak,
  SendMessages,
  SendMessagesInThreads,
  SendTTSMessages,
  Speak,
  Stream,
  UseApplicationCommands,
  UseEmbeddedActivities,
  UseExternalEmojis,
  UseExternalStickers,
  UseVAD,
  ViewAuditLog,
  ViewChannel,
  ViewGuildInsights,
} as const

// Export as default for backwards compatibility with require()
export default permissions

// Type definition for the permissions object
export type PermissionName = keyof typeof permissions
export type PermissionLabel = (typeof permissions)[PermissionName]
