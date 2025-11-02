import mongoose from 'mongoose'
import type { BotClient } from '@src/structures'

const reqString = {
  type: String,
  required: true,
}

const Schema = new mongoose.Schema(
  {
    guild_id: reqString,
    channel_id: reqString,
    message_id: reqString,
    roles: [
      {
        _id: false,
        emote: reqString,
        role_id: reqString,
      },
    ],
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
)

export const model = mongoose.model('reaction-roles', Schema)

// Cache
const rrCache = new Map<string, any[]>()
const getKey = (
  guildId: string,
  channelId: string,
  messageId: string
): string => `${guildId}|${channelId}|${messageId}`

export async function cacheReactionRoles(client: BotClient): Promise<void> {
  // clear previous cache
  rrCache.clear()

  // load all docs from database
  const docs = await model.find().lean()

  // validate and cache docs
  for (const doc of docs) {
    const guild = client.guilds.cache.get(doc.guild_id)
    if (!guild) {
      // await model.deleteMany({ guild_id: doc.guild_id });
      continue
    }
    if (!guild.channels.cache.has(doc.channel_id)) {
      // await model.deleteMany({ guild_id: doc.guild_id, channel_id: doc.channel_id });
      continue
    }
    const key = getKey(doc.guild_id, doc.channel_id, doc.message_id)
    rrCache.set(key, doc.roles)
  }
}

export function getReactionRoles(
  guildId: string,
  channelId: string,
  messageId: string
): any[] {
  return rrCache.get(getKey(guildId, channelId, messageId)) || []
}

export async function addReactionRole(
  guildId: string,
  channelId: string,
  messageId: string,
  emote: string,
  roleId: string
): Promise<void> {
  const filter = {
    guild_id: guildId,
    channel_id: channelId,
    message_id: messageId,
  }

  // Pull if existing configuration is present
  await model.updateOne(filter, { $pull: { roles: { emote } } })

  const data = await model
    .findOneAndUpdate(
      filter,
      {
        $push: {
          roles: { emote, role_id: roleId },
        },
      },
      { upsert: true, new: true }
    )
    .lean()

  // update cache
  const key = getKey(guildId, channelId, messageId)
  rrCache.set(key, data.roles)
}

export async function removeReactionRole(
  guildId: string,
  channelId: string,
  messageId: string
): Promise<void> {
  await model.deleteOne({
    guild_id: guildId,
    channel_id: channelId,
    message_id: messageId,
  })
  rrCache.delete(getKey(guildId, channelId, messageId))
}
