import type { BotClient } from '@src/structures'
import { Model as GuildModel, deleteGuildFromCache } from '@schemas/Guild'
import { Model as AiMemoryModel } from '@schemas/AiMemory'
import { model as GiveawayModel } from '@schemas/Giveaways'
import { Model as MemberModel } from '@schemas/Member'
import { Model as MemberStatsModel } from '@schemas/MemberStats'
import {
  model as ReactionRoleModel,
  clearGuildReactionRoleCache,
} from '@schemas/ReactionRoles'
import { model as SuggestionModel } from '@schemas/Suggestions'
import { model as ModLogModel } from '@schemas/ModLog'
import { Model as AutomodLogModel } from '@schemas/AutomodLogs'

/**
 * Cleanup expired guilds (left more than 24 hours ago)
 * Deletes all guild-related data from all collections
 * @param client - The bot client instance
 * @returns Statistics about the cleanup operation
 */
export async function cleanupExpiredGuilds(client: BotClient): Promise<{
  success: boolean
  expiredGuildsFound: number
  guildsCleaned: number
  guildsSkipped: number
  totalRecordsDeleted: number
  errors: number
}> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Find guilds that left more than 24 hours ago
    const expiredGuilds = await GuildModel.find({
      'server.leftAt': { $exists: true, $lt: twentyFourHoursAgo },
    }).lean()

    if (expiredGuilds.length === 0) {
      client.logger.log('No expired guilds to clean up')
      return {
        success: true,
        expiredGuildsFound: 0,
        guildsCleaned: 0,
        guildsSkipped: 0,
        totalRecordsDeleted: 0,
        errors: 0,
      }
    }

    client.logger.log(
      `Found ${expiredGuilds.length} expired guild(s) to clean up`
    )

    let totalDeleted = 0
    let totalErrors = 0
    let guildsCleaned = 0
    let guildsSkipped = 0

    for (const guild of expiredGuilds) {
      const guildId = guild._id

      // Double-check: Don't delete if bot is still in the guild
      if (client.guilds.cache.has(guildId)) {
        guildsSkipped++
        client.logger.warn(
          `Skipping cleanup for guild ${guildId} - bot is still in guild`
        )
        continue
      }

      try {
        const deleted = await deleteGuildData(guildId)
        totalDeleted += deleted.total
        guildsCleaned++
        client.logger.success(
          `Cleaned up guild ${guildId}: ${deleted.total} records deleted across ${deleted.collections} collections`
        )
      } catch (error: any) {
        totalErrors++
        client.logger.error(
          `Error cleaning up guild ${guildId}: ${error.message}`
        )
      }
    }

    // Always log final summary
    if (totalErrors === 0) {
      client.logger.success(
        `Guild cleanup complete: ${totalDeleted} records deleted from ${guildsCleaned} guild(s)${guildsSkipped > 0 ? `, ${guildsSkipped} skipped` : ''}`
      )
    } else {
      client.logger.warn(
        `Guild cleanup completed with ${totalErrors} error(s): ${totalDeleted} records deleted from ${guildsCleaned} guild(s)${guildsSkipped > 0 ? `, ${guildsSkipped} skipped` : ''}`
      )
    }

    return {
      success: totalErrors === 0,
      expiredGuildsFound: expiredGuilds.length,
      guildsCleaned,
      guildsSkipped,
      totalRecordsDeleted: totalDeleted,
      errors: totalErrors,
    }
  } catch (error: any) {
    client.logger.error(`Error in guild cleanup daemon: ${error.message}`)
    return {
      success: false,
      expiredGuildsFound: 0,
      guildsCleaned: 0,
      guildsSkipped: 0,
      totalRecordsDeleted: 0,
      errors: 1,
    }
  }
}

/**
 * Delete all data related to a guild
 * @param guildId - The guild ID to delete
 * @returns Statistics about deleted records
 */
async function deleteGuildData(guildId: string): Promise<{
  total: number
  collections: number
  details: Record<string, number>
}> {
  const details: Record<string, number> = {}
  let collections = 0

  // 1. Delete Guild document
  const guildResult = await GuildModel.findByIdAndDelete(guildId)
  if (guildResult) {
    deleteGuildFromCache(guildId)
    details.guild = 1
    collections++
  }

  // 2. Delete AI Memories (only guild-specific, not user memories with guildId=null)
  const aiMemoryResult = await AiMemoryModel.deleteMany({
    guildId: guildId, // Only delete where guildId is explicitly set to this guild
  })
  if (aiMemoryResult.deletedCount > 0) {
    details.aiMemory = aiMemoryResult.deletedCount
    collections++
  }

  // 3. Delete Giveaways
  const giveawayResult = await GiveawayModel.deleteMany({ guildId })
  if (giveawayResult.deletedCount > 0) {
    details.giveaways = giveawayResult.deletedCount
    collections++
  }

  // 4. Delete Members
  const memberResult = await MemberModel.deleteMany({ guild_id: guildId })
  if (memberResult.deletedCount > 0) {
    details.members = memberResult.deletedCount
    collections++
  }

  // 5. Delete Member Stats
  const memberStatsResult = await MemberStatsModel.deleteMany({
    guild_id: guildId,
  })
  if (memberStatsResult.deletedCount > 0) {
    details.memberStats = memberStatsResult.deletedCount
    collections++
  }

  // 6. Delete Reaction Roles
  const reactionRoleResult = await ReactionRoleModel.deleteMany({
    guild_id: guildId,
  })
  if (reactionRoleResult.deletedCount > 0) {
    clearGuildReactionRoleCache(guildId)
    details.reactionRoles = reactionRoleResult.deletedCount
    collections++
  }

  // 7. Delete Suggestions
  const suggestionResult = await SuggestionModel.deleteMany({
    guild_id: guildId,
  })
  if (suggestionResult.deletedCount > 0) {
    details.suggestions = suggestionResult.deletedCount
    collections++
  }

  // 8. Delete Mod Logs
  const modLogResult = await ModLogModel.deleteMany({ guild_id: guildId })
  if (modLogResult.deletedCount > 0) {
    details.modLogs = modLogResult.deletedCount
    collections++
  }

  // 9. Delete Automod Logs
  const automodLogResult = await AutomodLogModel.deleteMany({
    guild_id: guildId,
  })
  if (automodLogResult.deletedCount > 0) {
    details.automodLogs = automodLogResult.deletedCount
    collections++
  }

  const total = Object.values(details).reduce((sum, count) => sum + count, 0)

  return { total, collections, details }
}
