// @root/src/config/aiResponder.ts

// AiConfig type is globally available from types/global.d.ts
import { getAiConfig } from '../database/schemas/Dev'
import config from './config'
import { secret } from './secrets'

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

    // Merge with config (config takes precedence, then DB cache)
    const geminiKey = secret.GEMINI_KEY || ''
    if (!geminiKey && this.cache.globallyEnabled) {
      throw new Error(
        'GEMINI_KEY environment variable is required when AI is enabled'
      )
    }

    const aiConfig = {
      globallyEnabled: this.cache.globallyEnabled,
      model: config.AI.MODEL || this.cache.model,
      maxTokens: config.AI.MAX_TOKENS || this.cache.maxTokens || 1024,
      timeoutMs: config.AI.TIMEOUT_MS || this.cache.timeoutMs || 20000,
      systemPrompt:
        config.AI.SYSTEM_PROMPT ||
        this.cache.systemPrompt ||
        'You are Amina, a helpful Discord bot assistant.',
      temperature:
        this.parseTemperature(config.AI.TEMPERATURE.toString()) ??
        this.cache.temperature ??
        0.7,
      dmEnabledGlobally:
        config.AI.DM_ENABLED_GLOBALLY || this.cache.dmEnabledGlobally,
      geminiKey,
      upstashUrl: config.AI.UPSTASH_URL,
      upstashToken: secret.UPSTASH_VECTOR || '',
    }

    // Validate config
    if (aiConfig.globallyEnabled) {
      if (!aiConfig.geminiKey) throw new Error('GEMINI_KEY is required')
      if (!aiConfig.upstashToken)
        throw new Error('UPSTASH_VECTOR token is required')
      if (!aiConfig.model) throw new Error('Model name is required')
      if (!aiConfig.systemPrompt) throw new Error('System prompt is required')
    }

    return aiConfig
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
