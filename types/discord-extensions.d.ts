/* eslint-disable @typescript-eslint/no-unused-vars */
// Discord.js prototype extensions

import type {
  MessagePayload,
  MessageCreateOptions,
  MessageReplyOptions,
} from 'discord.js'

declare module 'discord.js' {
  interface Guild {
    findMatchingChannels(query: string, type?: any[]): any[]
    findMatchingVoiceChannels(query: string, type?: any[]): any[]
    findMatchingRoles(query: string): any[]
    resolveMember(query: string, exact?: boolean): Promise<any>
    fetchMemberStats(): Promise<number[]>
  }

  interface GuildChannel {
    canSendEmbeds(): boolean
    safeSend(
      content: string | MessagePayload | MessageCreateOptions,
      seconds?: number
    ): Promise<any>
  }

  interface Message {
    safeReply(
      content: string | MessagePayload | MessageReplyOptions,
      seconds?: number
    ): Promise<any>
  }
}

export {}

