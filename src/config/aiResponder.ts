// @root/src/config/aiResponder.ts

import { getAiConfig } from '../database/schemas/Dev'

interface AiConfig {
  globallyEnabled: boolean
  model: string
  maxTokens: number
  timeoutMs: number
  systemPrompt: string
  temperature: number
  dmEnabledGlobally: boolean
  geminiKey: string
  upstashUrl: string
  upstashToken: string
}

class ConfigCache {
  private cache: any = null
  private lastFetch: number = 0
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  async getConfig(): Promise<AiConfig> {
    // Fetch from Mongo if cache expired
    if (!this.cache || Date.now() - this.lastFetch > this.TTL) {
      const dbConfig = await getAiConfig()
      this.cache = dbConfig
      this.lastFetch = Date.now()
    }

    // Merge with env vars (env takes precedence for secrets)
    const geminiKey = process.env.GEMINI_KEY || ''
    if (!geminiKey && this.cache.globallyEnabled) {
      throw new Error(
        'GEMINI_KEY environment variable is required when AI is enabled'
      )
    }

    const config = {
      globallyEnabled: this.cache.globallyEnabled,
      model: process.env.GEMINI_MODEL || this.cache.model,
      maxTokens: Number(process.env.MAX_TOKENS) || this.cache.maxTokens || 1024,
      timeoutMs:
        Number(process.env.TIMEOUT_MS) || this.cache.timeoutMs || 20000,
      systemPrompt:
        process.env.SYSTEM_PROMPT ||
        this.cache.systemPrompt ||
        'You are Amina, a helpful Discord bot assistant.',
      temperature:
        this.parseTemperature(process.env.TEMPERATURE) ??
        this.cache.temperature ??
        0.7,
      dmEnabledGlobally:
        process.env.DM_ENABLED_GLOBALLY === 'true' ||
        this.cache.dmEnabledGlobally,
      geminiKey,
      upstashUrl: 'https://up-wolf-22896-us1-vector.upstash.io',
      upstashToken: process.env.UPSTASH_VECTOR || '',
    }

    // Validate config
    if (config.globallyEnabled) {
      if (!config.geminiKey) throw new Error('GEMINI_KEY is required')
      if (!config.upstashToken)
        throw new Error('UPSTASH_VECTOR token is required')
      if (!config.model) throw new Error('Model name is required')
      if (!config.systemPrompt) throw new Error('System prompt is required')
    }

    return config
  }

  private parseTemperature(value: string | undefined): number | null {
    if (!value) return null
    const num = Number(value)
    if (isNaN(num)) return null
    return Math.max(0, Math.min(2, num))
  }

  invalidate() {
    this.cache = null
    this.lastFetch = 0
  }
}

export const configCache = new ConfigCache()
