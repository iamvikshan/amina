// @root/src/services/aiResponder.ts

import type { Message } from 'discord.js'
import { getSettings } from '../database/schemas/Guild'
import { configCache } from '../config/aiResponder'
import { GoogleAiClient } from '../helpers/googleAiClient'
// ConversationMessage is now globally available - see types/services.d.ts
import {
  conversationBuffer,
  type Message as BufferMessage,
} from '../structures/conversationBuffer'
import { memoryService } from './memoryService'
import Logger from '../helpers/Logger'
import { config } from '../config'

const logger = Logger

// ResponseMode and RateLimitEntry are now globally available - see types/services.d.ts

export class AiResponderService {
  private client: GoogleAiClient | null = null
  private rateLimits: Map<string, RateLimitEntry> = new Map()
  private failureCount: Map<string, number[]> = new Map() // guildId -> timestamps
  private readonly USER_COOLDOWN_MS = 3000 // 3 seconds per user
  private readonly CHANNEL_COOLDOWN_MS = 1000 // 1 second per channel in free-will
  private readonly FAILURE_THRESHOLD = 5
  private readonly FAILURE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
  // private readonly MAX_FREEWILL_CHANNELS = 2 // Max channels for regular guilds (unlimited for test guild)

  /**
   * Check if a guild is the test guild
   */
  private isTestGuild(guildId: string | null): boolean {
    if (!guildId) return false
    return guildId === config.BOT.TEST_GUILD_ID
  }

  /**
   * Get free-will channels from guild settings
   */
  private getFreeWillChannels(guildSettings: any): string[] {
    if (!guildSettings?.aiResponder) return []
    return guildSettings.aiResponder.freeWillChannels || []
  }

  /**
   * Check if a message is a reply to the bot
   * Fetches the referenced message and verifies it's from the bot
   */
  private async isReplyToBot(message: Message): Promise<boolean> {
    if (!message.reference?.messageId || !message.client.user) {
      return false
    }

    try {
      const referencedMessage = await message.channel.messages.fetch(
        message.reference.messageId
      )
      return referencedMessage.author.id === message.client.user.id
    } catch (error) {
      // If we can't fetch the message (deleted, no permissions, etc.), assume it's not a reply to bot
      logger.debug(
        `Could not fetch referenced message ${message.reference.messageId}: ${error}`
      )
      return false
    }
  }

  async initialize() {
    try {
      const config = await configCache.getConfig()

      logger.debug(
        `AI Config loaded - Enabled: ${config.globallyEnabled}, Model: ${config.model}, HasKey: ${!!config.geminiKey}`
      )

      if (config.globallyEnabled && config.geminiKey) {
        this.client = new GoogleAiClient(
          config.geminiKey,
          config.model,
          config.timeoutMs
        )
        logger.success(`AI Responder initialized - Model: ${config.model}`)
      } else {
        logger.log('AI Responder disabled (global toggle off or no key)')
      }
    } catch (error: any) {
      logger.error(`Failed to initialize AI Responder: ${error.message}`, error)
    }
  }

  async shouldRespond(message: Message): Promise<ResponseMode> {
    try {
      // Filter out bots, system messages, webhooks
      if (message.author.bot || message.system || message.webhookId) {
        return false
      }

      // Check user ignoreMe preference (fail early)
      const { getUser } = await import('@schemas/User')
      const userData = await getUser(message.author)
      if (userData.minaAi?.ignoreMe) {
        // Send helpful message if they try to interact (DM or mention)
        if (!message.guild || message.mentions.has(message.client.user!)) {
          if ('send' in message.channel) {
            await message.channel
              .send({
                content: `I've been set to ignore you. You can change this in \`/mina-ai\` → Settings → Toggle "Ignore Me" off.`,
              })
              .catch(() => {})
          }
        }
        return false
      }

      const config = await configCache.getConfig()

      // Check global toggle
      if (!config.globallyEnabled || !this.client) {
        return false
      }

      // DM handling
      if (!message.guild) {
        // Check global DM enable (developer control)
        if (!config.dmEnabledGlobally) {
          return false
        }
        // Check user-level DM preference
        if (!userData.minaAi?.allowDMs) {
          return false
        }
        return 'dm'
      }

      // Guild channel handling
      const guildSettings = await getSettings(message.guild)

      if (!guildSettings.aiResponder?.enabled) {
        return false
      }

      // Check if guild has too many failures
      if (this.isGuildDisabled(message.guild.id)) {
        return false
      }

      const freeWillChannels = this.getFreeWillChannels(guildSettings)
      const isTestGuild = this.isTestGuild(message.guild.id)
      const isFreeWillChannel = freeWillChannels.includes(message.channel.id)

      // Check for explicit @mentions
      const hasExplicitMention = message.mentions.has(message.client.user!)

      // Check if reply is to bot (async - only needed for mention-only mode)
      const isReplyToBot = await this.isReplyToBot(message)

      // For free-will channels, we check if mentioned/replied (for helpful tip), but respond to everything
      // For mention-only mode, we need to verify it's actually targeting the bot
      const isMentioned = hasExplicitMention || isReplyToBot

      // Test guild: Allow both mention mode AND free-will simultaneously
      if (isTestGuild) {
        // Free will channels always work (no mention needed)
        if (isFreeWillChannel) {
          return 'freeWill'
        }
        // Mentions work in any channel (even when mentionOnly is false)
        if (isMentioned) {
          return 'mention'
        }
        return false
      }

      // Regular guild: Mutually exclusive (mention-only OR free-will, not both)
      if (isFreeWillChannel && !guildSettings.aiResponder.mentionOnly) {
        // If mentioned in free-will channel, show helpful message
        if (isMentioned) {
          // We'll handle the helpful message in handleMessage
          return 'freeWill'
        }
        return 'freeWill'
      }

      // Mention mode (only if not in free-will channel or mentionOnly is true)
      // Only respond if explicitly @mentioned OR replying to bot's message
      if (
        guildSettings.aiResponder.mentionOnly &&
        isMentioned &&
        !isFreeWillChannel
      ) {
        return 'mention'
      }

      return false
    } catch (error: any) {
      logger.error(`Error in shouldRespond: ${error.message}`, error)
      return false
    }
  }

  async handleMessage(message: Message, mode: ResponseMode): Promise<void> {
    if (!mode || !this.client) return

    try {
      // Check if user @mentioned in a non-free-will channel and show helpful tip about free will channels
      if (message.guild && mode === 'mention') {
        const guildSettings = await getSettings(message.guild)
        const freeWillChannels = this.getFreeWillChannels(guildSettings)

        // Only show tip if there are free will channels configured
        if (freeWillChannels.length > 0) {
          const channelMentions = freeWillChannels
            .map(id => `<#${id}>`)
            .join(' or ')
          if ('send' in message.channel) {
            await message.channel
              .send({
                content: `💡 **Tip:** I'm also active in ${channelMentions}! You don't need to @mention me there - just send a message and I'll respond. You can also DM me anytime! ✨`,
              })
              .catch(() => {})
          }
        }
      }

      // Rate limiting
      if (this.isRateLimited(message, mode)) {
        logger.debug(
          `Message rate limited - User: ${message.author.id}, Channel: ${message.channel.id}`
        )
        return
      }

      // Show typing indicator
      if ('sendTyping' in message.channel) {
        await message.channel.sendTyping()
      }

      // Build conversation context
      const conversationId = this.getConversationId(message)

      // Get history BEFORE appending current message
      let history = conversationBuffer.getHistory(conversationId)

      // Validate: history must start with 'user' role (Google AI requirement)
      while (history.length > 0 && history[0].role !== 'user') {
        history.shift() // Remove leading 'model' messages
      }

      // Append user message to buffer for next interaction
      conversationBuffer.append(
        conversationId,
        'user',
        message.content,
        message.author.id,
        message.author.username,
        message.member?.displayName || message.author.username
      )

      const config = await configCache.getConfig()

      // Get user preferences for memory recall
      const { getUser } = await import('@schemas/User')
      const userData = await getUser(message.author)

      // Get active participants (hybrid: message count + time window)
      const participants = this.getActiveParticipants(
        history,
        message.author.id
      )
      const participantIds = Array.from(participants)

      // Fetch profiles for all participants
      const participantProfiles =
        await this.getParticipantProfiles(participantIds)

      // Build participant context section
      let participantContext = ''
      if (participantIds.length > 1) {
        // Only show context if there are multiple participants
        participantContext = '\n\n**Conversation Participants:**\n'

        for (const userId of participantIds) {
          const profile = participantProfiles.get(userId)
          if (!profile) continue

          try {
            // Fetch Discord user for display name
            const user = await message.client.users
              .fetch(userId)
              .catch(() => null)
            if (!user) continue

            const name =
              message.guild?.members.cache.get(userId)?.displayName ||
              user.username
            participantContext += `\n**${name}** (${user.username}):\n`

            // Respect privacy settings
            if (profile.privacy?.showPronouns && profile.pronouns) {
              participantContext += `- Pronouns: ${profile.pronouns}\n`
            }
            if (profile.bio) {
              participantContext += `- Bio: ${profile.bio.substring(0, 200)}\n`
            }
            if (profile.interests?.length > 0) {
              participantContext += `- Interests: ${profile.interests.join(', ')}\n`
            }
            if (profile.privacy?.showRegion && profile.region) {
              participantContext += `- Region: ${profile.region}\n`
            }
            if (profile.timezone) {
              participantContext += `- Timezone: ${profile.timezone}\n`
            }
          } catch (error: any) {
            logger.debug(
              `Failed to fetch Discord user ${userId}: ${error.message}`
            )
          }
        }
      }

      // Recall relevant memories for all active participants
      const guildId = message.guild?.id || null
      const allMemories = new Map<string, any[]>() // userId -> RecalledMemory[]

      // Recall memories for each participant
      for (const userId of participantIds) {
        try {
          // Get user preferences for this participant
          const participantUser = { id: userId } as any
          const participantUserData = await getUser(participantUser)

          const userMemories = await memoryService.recallMemories(
            message.content, // Use current message for relevance
            userId,
            guildId,
            3, // Fewer per user to avoid token bloat
            {
              combineDmWithServer:
                participantUserData.minaAi?.combineDmWithServer || false,
              globalServerMemories:
                participantUserData.minaAi?.globalServerMemories !== false,
            }
          )

          if (userMemories.length > 0) {
            allMemories.set(userId, userMemories)
          }
        } catch (error: any) {
          logger.debug(
            `Failed to recall memories for user ${userId}: ${error.message}`
          )
        }
      }

      // Build memory context grouped by user
      let memoryContext = ''
      if (allMemories.size > 0) {
        memoryContext = '\n\n**Relevant Memories by Participant:**\n'
        for (const [userId, memories] of allMemories.entries()) {
          if (memories.length === 0) continue

          try {
            const user = await message.client.users
              .fetch(userId)
              .catch(() => null)
            if (!user) continue

            const name =
              message.guild?.members.cache.get(userId)?.displayName ||
              user.username
            memoryContext += `\n**${name}:**\n`
            memories.forEach(m => {
              memoryContext += `- ${m.key}: ${m.value}\n`
            })
          } catch (error: any) {
            logger.debug(`Failed to fetch user ${userId} for memory context`)
          }
        }
      }

      // Build enhanced prompt with memories and participant context
      let enhancedPrompt = config.systemPrompt
      if (memoryContext) {
        enhancedPrompt += memoryContext
      }
      if (participantContext) {
        enhancedPrompt += participantContext
      }

      const totalMemories = Array.from(allMemories.values()).reduce(
        (sum, mems) => sum + mems.length,
        0
      )
      logger.debug(
        `Generating AI response - Model: ${config.model}, Participants: ${participantIds.length}, Total Memories: ${totalMemories}, History: ${history.length} messages`
      )

      // Log what we're sending to help debug
      logger.debug(`User message: ${message.content.substring(0, 100)}`)

      // Format history with speaker attribution for AI
      const formattedHistory = this.formatHistoryForAI(history)

      // Generate response
      const result = await this.client.generateResponse(
        enhancedPrompt,
        formattedHistory,
        message.content,
        config.maxTokens,
        config.temperature
      )

      // Send reply
      await message.reply(result.text)

      // Append bot response to conversation buffer
      conversationBuffer.append(conversationId, 'model', result.text)

      // Extract and store memories (async, don't block)
      this.extractAndStoreMemories(message, history).catch(err =>
        logger.warn(`Failed to extract memories: ${err.message}`)
      )

      // Log success
      logger.debug(
        `AI response sent - Latency: ${result.latency}ms, Mode: ${mode}`
      )

      // Clear failure count on success
      if (message.guild) {
        this.clearFailures(message.guild.id)
      }
    } catch (error: any) {
      logger.warn(
        `AI response failed - Error: ${error.message}, Guild: ${message.guild?.id}, Channel: ${message.channel.id}`
      )

      // Track failure
      if (message.guild) {
        this.recordFailure(message.guild.id)
      }

      // Send fallback message
      await message
        .reply(
          "I'm having trouble thinking right now. Please try again in a moment."
        )
        .catch(() => {
          // Ignore if we can't send fallback
        })
    }
  }

  private getConversationId(message: Message): string {
    if (!message.guild) {
      return `dm:${message.author.id}`
    }
    return `guild:${message.guild.id}:channel:${message.channel.id}`
  }

  private isRateLimited(message: Message, mode: ResponseMode): boolean {
    const userKey = `${message.channel.id}:${message.author.id}`
    const channelKey = `channel:${message.channel.id}`

    const now = Date.now()

    // Per-user cooldown
    const userLimit = this.rateLimits.get(userKey)
    if (userLimit && now - userLimit.timestamp < this.USER_COOLDOWN_MS) {
      return true
    }

    // Per-channel cooldown (free-will only)
    if (mode === 'freeWill') {
      const channelLimit = this.rateLimits.get(channelKey)
      if (
        channelLimit &&
        now - channelLimit.timestamp < this.CHANNEL_COOLDOWN_MS
      ) {
        return true
      }
      this.rateLimits.set(channelKey, { timestamp: now })
    }

    this.rateLimits.set(userKey, { timestamp: now })
    return false
  }

  private recordFailure(guildId: string) {
    const failures = this.failureCount.get(guildId) || []
    failures.push(Date.now())
    this.failureCount.set(guildId, failures)

    // Check if threshold exceeded
    const recentFailures = this.getRecentFailures(guildId)
    if (recentFailures >= this.FAILURE_THRESHOLD) {
      logger.error('AI auto-disabled for guild due to repeated failures', {
        guildId,
        failureCount: recentFailures,
      })
      // Here you could also update the guild settings to disable AI
    }
  }

  private clearFailures(guildId: string) {
    this.failureCount.delete(guildId)
  }

  private getRecentFailures(guildId: string): number {
    const failures = this.failureCount.get(guildId) || []
    const now = Date.now()
    const recent = failures.filter(
      timestamp => now - timestamp < this.FAILURE_WINDOW_MS
    )
    this.failureCount.set(guildId, recent)
    return recent.length
  }

  private isGuildDisabled(guildId: string): boolean {
    return this.getRecentFailures(guildId) >= this.FAILURE_THRESHOLD
  }

  /**
   * Format conversation history with speaker attribution for AI
   * Adds display names to user messages so AI can track who said what
   */
  private formatHistoryForAI(
    history: BufferMessage[]
  ): globalThis.ConversationMessage[] {
    return history.map(msg => {
      if (msg.role === 'model') {
        return { role: 'model', content: msg.content }
      }

      // User message with attribution
      if (msg.userId && msg.displayName) {
        // Format: "Alice: I like pizza"
        const attributedContent = `${msg.displayName}: ${msg.content}`
        return { role: 'user', content: attributedContent }
      }

      // Fallback for old messages without attribution
      return { role: 'user', content: msg.content }
    })
  }

  /**
   * Get active participants using hybrid approach:
   * - Users from last N messages (conversation thread context)
   * - Users who spoke within time window (recent activity)
   * This handles both active conversations and prevents stale participants
   */
  private getActiveParticipants(
    history: BufferMessage[],
    currentUserId: string,
    timeWindowMs: number = 10 * 60 * 1000, // 10 minutes default
    maxMessageLookback: number = 15 // Last 15 messages default
  ): Set<string> {
    const participants = new Set<string>()
    const now = Date.now()

    // Always include current message author
    participants.add(currentUserId)

    // Get users from last N messages (conversation thread)
    const recentMessages = history.slice(-maxMessageLookback)
    for (const msg of recentMessages) {
      if (msg.role === 'user' && msg.userId) {
        participants.add(msg.userId)
      }
    }

    // Also include users who spoke within time window (recent activity)
    for (const msg of history) {
      if (msg.role === 'user' && msg.userId) {
        const messageAge = now - msg.timestamp
        if (messageAge <= timeWindowMs) {
          participants.add(msg.userId)
        }
      }
    }

    logger.debug(
      `Active participants detected: ${participants.size} users (from ${history.length} messages)`
    )

    return participants
  }

  /**
   * Fetch profiles for all participants
   * Respects privacy settings and caches results
   */
  private async getParticipantProfiles(
    userIds: string[]
  ): Promise<Map<string, any>> {
    const profiles = new Map<string, any>()

    // Batch fetch user data
    const { getUser } = await import('@schemas/User')
    const fetchPromises = userIds.map(async userId => {
      try {
        // Create a minimal user object for getUser (it only needs id)
        const user = { id: userId } as any
        const userData = await getUser(user)
        return { userId, userData }
      } catch (error: any) {
        logger.warn(
          `Failed to fetch profile for user ${userId}: ${error.message}`
        )
        return { userId, userData: null }
      }
    })

    const results = await Promise.all(fetchPromises)

    for (const { userId, userData } of results) {
      if (userData?.profile) {
        profiles.set(userId, userData.profile)
      }
    }

    logger.debug(
      `Fetched profiles for ${profiles.size}/${userIds.length} participants`
    )
    return profiles
  }

  private async extractAndStoreMemories(
    message: Message,
    history: any[]
  ): Promise<void> {
    // Only extract if conversation is long enough
    if (history.length < 5) return

    const guildId = message.guild?.id || null
    const userId = message.author.id

    try {
      // Extract memories using AI
      const facts = await memoryService.extractMemories(
        history,
        userId,
        guildId
      )

      // Store each memory
      const conversationSnippet = history
        .slice(-3)
        .map(m => m.content.substring(0, 50))
        .join(' | ')

      for (const fact of facts) {
        await memoryService.storeMemory(
          fact,
          userId,
          guildId,
          conversationSnippet
        )
      }

      if (facts.length > 0) {
        logger.debug(`Stored ${facts.length} new memories for user ${userId}`)
      }
    } catch (error: any) {
      logger.warn(`Memory extraction failed: ${error.message}`)
    }
  }
}

// Singleton instance
export const aiResponderService = new AiResponderService()
