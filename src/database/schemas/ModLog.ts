import mongoose from 'mongoose'
import type { GuildMember } from 'discord.js'

const reqString = {
  type: String,
  required: true,
}

const Schema = new mongoose.Schema(
  {
    guild_id: reqString,
    member_id: String,
    reason: String,
    admin: {
      id: reqString,
      tag: reqString,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'PURGE',
        'WARN',
        'TIMEOUT',
        'UNTIMEOUT',
        'KICK',
        'SOFTBAN',
        'BAN',
        'UNBAN',
        'VMUTE',
        'VUNMUTE',
        'DEAFEN',
        'UNDEAFEN',
        'DISCONNECT',
        'MOVE',
      ],
    },
  },
  {
    versionKey: false,
    autoIndex: false,
    timestamps: {
      createdAt: 'created_at',
      updatedAt: false,
    },
  }
)

export const model = mongoose.model('mod-logs', Schema)

export async function addModLogToDb(
  admin: GuildMember,
  target: any,
  reason: string,
  type: string
): Promise<any> {
  return await new model({
    guild_id: admin.guild.id,
    member_id: target.id,
    reason,
    admin: {
      id: admin.id,
      tag: admin.user.tag,
    },
    type,
  }).save()
}

export async function getWarningLogs(
  guildId: string,
  targetId: string
): Promise<any[]> {
  return model
    .find({
      guild_id: guildId,
      member_id: targetId,
      type: 'WARN',
    })
    .lean()
}

export async function clearWarningLogs(
  guildId: string,
  targetId: string
): Promise<any> {
  return model.deleteMany({
    guild_id: guildId,
    member_id: targetId,
    type: 'WARN',
  })
}
