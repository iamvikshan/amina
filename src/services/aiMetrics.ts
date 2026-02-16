// @root/src/services/aiMetrics.ts

import Logger from '@helpers/Logger'

const logger = Logger

interface MetricEntry {
  messages: number
  tokens: number
  toolCalls: number
  memoriesCreated: number
}

export interface AiMetricEvent {
  userId: string
  guildId: string | null
  tokensUsed: number
  toolCalls: number
  memoriesCreated: number
}

export interface AiMetricsDeps {
  userModel: { updateOne: (...args: any[]) => Promise<any> }
  guildModel: { updateOne: (...args: any[]) => Promise<any> }
  incrementAiStats: (stats: {
    messages?: number
    tokens?: number
    toolCalls?: number
  }) => Promise<void>
}

export class AiMetricsService {
  private userBuffer: Map<string, MetricEntry> = new Map()
  private guildBuffer: Map<string, MetricEntry> = new Map()
  private globalBuffer: MetricEntry = {
    messages: 0,
    tokens: 0,
    toolCalls: 0,
    memoriesCreated: 0,
  }
  private flushInterval: ReturnType<typeof setInterval> | null = null
  private isFlushing = false
  private readonly FLUSH_INTERVAL_MS = 30_000 // 30 seconds
  private deps: AiMetricsDeps | null

  constructor(deps?: AiMetricsDeps) {
    this.deps = deps ?? null
  }

  private async resolveDeps(): Promise<AiMetricsDeps> {
    if (this.deps) return this.deps
    const UserSchema = await import('@schemas/User')
    const { Model: GuildModelRef } = await import('@schemas/Guild')
    const { incrementAiStats: incrementRef } = await import('@schemas/Dev')
    this.deps = {
      userModel: UserSchema.default.Model,
      guildModel: GuildModelRef,
      incrementAiStats: incrementRef,
    }
    return this.deps
  }

  start() {
    if (this.flushInterval) return
    this.flushInterval = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS)
    logger.success('AI Metrics service started (flush interval: 30s)')
  }

  stop() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
  }

  record(event: AiMetricEvent) {
    // User buffer
    const userEntry = this.userBuffer.get(event.userId) ?? {
      messages: 0,
      tokens: 0,
      toolCalls: 0,
      memoriesCreated: 0,
    }
    userEntry.messages += 1
    userEntry.tokens += event.tokensUsed
    userEntry.toolCalls += event.toolCalls
    userEntry.memoriesCreated += event.memoriesCreated
    this.userBuffer.set(event.userId, userEntry)

    // Guild buffer (skip for DMs)
    if (event.guildId) {
      const guildEntry = this.guildBuffer.get(event.guildId) ?? {
        messages: 0,
        tokens: 0,
        toolCalls: 0,
        memoriesCreated: 0,
      }
      guildEntry.messages += 1
      guildEntry.tokens += event.tokensUsed
      guildEntry.toolCalls += event.toolCalls
      guildEntry.memoriesCreated += event.memoriesCreated
      this.guildBuffer.set(event.guildId, guildEntry)
    }

    // Global buffer
    this.globalBuffer.messages += 1
    this.globalBuffer.tokens += event.tokensUsed
    this.globalBuffer.toolCalls += event.toolCalls
  }

  async flush(): Promise<void> {
    // Prevent overlapping flushes
    if (this.isFlushing) return
    this.isFlushing = true

    try {
      // Snapshot and clear buffers atomically
      const users = new Map(this.userBuffer)
      const guilds = new Map(this.guildBuffer)
      const global = { ...this.globalBuffer }
      this.userBuffer.clear()
      this.guildBuffer.clear()
      this.globalBuffer = {
        messages: 0,
        tokens: 0,
        toolCalls: 0,
        memoriesCreated: 0,
      }

      if (users.size === 0 && guilds.size === 0 && global.messages === 0) return

      try {
        const deps = await this.resolveDeps()

        // Track which operation index belongs to which source
        // so we can selectively re-buffer only failed operations
        const opSources: Array<
          | { type: 'user'; userId: string; entry: MetricEntry }
          | { type: 'guild'; guildId: string; entry: MetricEntry }
          | { type: 'global'; entry: MetricEntry }
        > = []
        const ops: Promise<any>[] = []

        // Batch user updates
        for (const [userId, entry] of users) {
          opSources.push({ type: 'user', userId, entry })
          ops.push(
            deps.userModel.updateOne(
              { _id: userId },
              {
                $inc: {
                  'minaAi.stats.messages': entry.messages,
                  'minaAi.stats.tokensUsed': entry.tokens,
                  'minaAi.stats.toolCalls': entry.toolCalls,
                  'minaAi.stats.memoriesCreated': entry.memoriesCreated,
                },
                $set: { 'minaAi.stats.lastInteraction': new Date() },
              },
              { upsert: true }
            )
          )
        }

        // Batch guild updates
        for (const [guildId, entry] of guilds) {
          opSources.push({ type: 'guild', guildId, entry })
          ops.push(
            deps.guildModel.updateOne(
              { _id: guildId },
              {
                $inc: {
                  'aiResponder.stats.totalMessages': entry.messages,
                  'aiResponder.stats.tokensUsed': entry.tokens,
                  'aiResponder.stats.toolCalls': entry.toolCalls,
                },
              },
              { upsert: true }
            )
          )
        }

        // Global stats
        if (global.messages > 0) {
          opSources.push({ type: 'global', entry: global })
          ops.push(
            deps.incrementAiStats({
              messages: global.messages,
              tokens: global.tokens,
              toolCalls: global.toolCalls,
            })
          )
        }

        const results = await Promise.allSettled(ops)

        // Selectively re-buffer only failed operations
        let failedCount = 0
        for (let i = 0; i < results.length; i++) {
          if (results[i].status === 'rejected') {
            failedCount++
            const source = opSources[i]

            if (source.type === 'user') {
              const existing = this.userBuffer.get(source.userId) ?? {
                messages: 0,
                tokens: 0,
                toolCalls: 0,
                memoriesCreated: 0,
              }
              existing.messages += source.entry.messages
              existing.tokens += source.entry.tokens
              existing.toolCalls += source.entry.toolCalls
              existing.memoriesCreated += source.entry.memoriesCreated
              this.userBuffer.set(source.userId, existing)
            } else if (source.type === 'guild') {
              const existing = this.guildBuffer.get(source.guildId) ?? {
                messages: 0,
                tokens: 0,
                toolCalls: 0,
                memoriesCreated: 0,
              }
              existing.messages += source.entry.messages
              existing.tokens += source.entry.tokens
              existing.toolCalls += source.entry.toolCalls
              existing.memoriesCreated += source.entry.memoriesCreated
              this.guildBuffer.set(source.guildId, existing)
            } else if (source.type === 'global') {
              this.globalBuffer.messages += source.entry.messages
              this.globalBuffer.tokens += source.entry.tokens
              this.globalBuffer.toolCalls += source.entry.toolCalls
            }
          }
        }

        if (failedCount > 0) {
          logger.error(
            `AI metrics flush partially failed: ${failedCount}/${ops.length} ops rejected`
          )
        } else {
          logger.debug(
            `AI metrics flushed: ${users.size} users, ${guilds.size} guilds, ${global.messages} global messages`
          )
        }
      } catch (err: any) {
        // resolveDeps() itself failed — re-buffer everything
        logger.error(`AI metrics flush failed (deps): ${err.message}`)
        for (const [userId, entry] of users) {
          const existing = this.userBuffer.get(userId) ?? {
            messages: 0,
            tokens: 0,
            toolCalls: 0,
            memoriesCreated: 0,
          }
          existing.messages += entry.messages
          existing.tokens += entry.tokens
          existing.toolCalls += entry.toolCalls
          existing.memoriesCreated += entry.memoriesCreated
          this.userBuffer.set(userId, existing)
        }
        for (const [guildId, entry] of guilds) {
          const existing = this.guildBuffer.get(guildId) ?? {
            messages: 0,
            tokens: 0,
            toolCalls: 0,
            memoriesCreated: 0,
          }
          existing.messages += entry.messages
          existing.tokens += entry.tokens
          existing.toolCalls += entry.toolCalls
          existing.memoriesCreated += entry.memoriesCreated
          this.guildBuffer.set(guildId, existing)
        }
        this.globalBuffer.messages += global.messages
        this.globalBuffer.tokens += global.tokens
        this.globalBuffer.toolCalls += global.toolCalls
      }
    } finally {
      this.isFlushing = false
    }
  }

  // Expose for testing
  get pendingUserCount() {
    return this.userBuffer.size
  }
  get pendingGuildCount() {
    return this.guildBuffer.size
  }
  get pendingGlobalMessages() {
    return this.globalBuffer.messages
  }
}

export const aiMetrics = new AiMetricsService()
