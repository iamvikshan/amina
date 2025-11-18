import mongoose from 'mongoose'
import type { GuildMember } from 'discord.js'

const reqString = {
  type: String,
  required: true,
}

const Schema = new mongoose.Schema(
  {
    guild_id: reqString,
    member_id: reqString,
    content: String,
    reason: String,
    strikes: Number,
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

export const Model = mongoose.model('automod-logs', Schema)

export async function addAutoModLogToDb(
  member: GuildMember,
  content: string,
  reason: string,
  strikes: number
): Promise<void> {
  if (!member) throw new Error('Member is undefined')
  await new Model({
    guild_id: member.guild.id,
    member_id: member.id,
    content,
    reason,
    strikes,
  }).save()
}
