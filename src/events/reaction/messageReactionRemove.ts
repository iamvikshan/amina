import { reactionRoleHandler } from '@src/handlers'
import type { BotClient } from '@src/structures'
import type { MessageReaction, PartialMessageReaction, User } from 'discord.js'

/**
 * Handles message reaction remove events
 * @param {BotClient} client - The bot client instance
 * @param {BotClient} _client - The _client
 * @param {MessageReaction | PartialMessageReaction} reaction - The reaction that was removed
 * @param {User} user - The user who removed the reaction
 * @returns {void} Nothing.
 */
export default async (
  _client: BotClient,
  reaction: MessageReaction | PartialMessageReaction,
  user: User,
): Promise<void> => {
  if (reaction.partial) {
    try {
      await reaction.fetch()
    } catch (_ex) {
      return // Possibly deleted
    }
  }

  await reactionRoleHandler.handleReactionRemove(
    reaction as MessageReaction,
    user,
  )
}
