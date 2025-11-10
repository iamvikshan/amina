import { reactionRoleHandler } from '@src/handlers'
import type { BotClient } from '@src/structures'
import type {
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
} from 'discord.js'

/**
 * Handles message reaction add events
 * @param {BotClient} client - The bot client instance
 * @param {MessageReaction | PartialMessageReaction} reaction - The reaction that was added
 * @param {User | PartialUser} user - The user who added the reaction
 */
export default async (
  client: BotClient,
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
): Promise<void> => {
  if (reaction.partial) {
    try {
      await reaction.fetch()
    } catch (_ex) {
      return // Failed to fetch message (maybe deleted)
    }
  }
  if (user.partial) await user.fetch()
  if (user.bot) return

  // Reaction Roles
  reactionRoleHandler.handleReactionAdd(
    reaction as MessageReaction,
    user as User
  )
}
