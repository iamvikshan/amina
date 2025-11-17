// @root/src/services/aiResponder.ts

import type { Message } from 'discord.js'
import { getSettings } from '../database/schemas/Guild'
import { configCache } from '../config/aiResponder'
import { GoogleAiClient } from '../helpers/googleAiClient'
import { conversationBuffer } from '../structures/conversationBuffer'
import { memoryService } from './memoryService'
import Logger from '../helpers/Logger'

const logger = Logger

type ResponseMode = 'dm' | 'mention' | 'freeWill' | false

interface RateLimitEntry {
  timestamp: number
}

export class AiResponderService {
  private client: GoogleAiClient | null = null
  private rateLimits: Map<string, RateLimitEntry> = new Map()
  private failureCount: Map<string, number[]> = new Map() // guildId -> timestamps
  private readonly USER_COOLDOWN_MS = 3000 // 3 seconds per user
  private readonly CHANNEL_COOLDOWN_MS = 1000 // 1 second per channel in free-will
  private readonly FAILURE_THRESHOLD = 5
  private readonly FAILURE_WINDOW_MS = 10 * 60 * 1000 // 10 minutes

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
          await message.channel
            .send({
              content: `I've been set to ignore you. You can change this in \`/mina-ai\` → Settings → Toggle "Ignore Me" off.`,
            })
            .catch(() => {})
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

      // Free-will channel
      if (
        guildSettings.aiResponder.freeWillChannelId === message.channel.id &&
        !guildSettings.aiResponder.mentionOnly
      ) {
        return 'freeWill'
      }

      // Mention mode
      if (
        guildSettings.aiResponder.mentionOnly &&
        (message.mentions.has(message.client.user!) ||
          message.reference?.messageId)
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
      conversationBuffer.append(conversationId, 'user', message.content)

      const config = await configCache.getConfig()

      // Get user preferences for memory recall
      const { getUser } = await import('@schemas/User')
      const userData = await getUser(message.author)

      // Recall relevant memories with user preferences
      const guildId = message.guild?.id || null
      const memories = await memoryService.recallMemories(
        message.content,
        message.author.id,
        guildId,
        5,
        {
          combineDmWithServer: userData.minaAi?.combineDmWithServer || false,
          globalServerMemories: userData.minaAi?.globalServerMemories !== false, // default true
        }
      )

      // Build enhanced prompt with memories
      let enhancedPrompt = config.systemPrompt
      if (memories.length > 0) {
        const memoryContext = memories
          .map(m => `- ${m.key}: ${m.value}`)
          .join('\n')
        enhancedPrompt += `\n\n**Context about this user:**\n${memoryContext}`
      }

      logger.debug(
        `Generating AI response - Model: ${config.model}, Memories: ${memories.length}, History: ${history.length} messages`
      )

      // Log what we're sending to help debug
      logger.debug(`User message: ${message.content.substring(0, 100)}`)

      // Generate response
      const result = await this.client.generateResponse(
        enhancedPrompt,
        history,
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
