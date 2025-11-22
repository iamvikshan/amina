// @root/src/config/aiResponder.ts

// AiConfig type is globally available from types/global.d.ts
import { getAiConfig } from '../database/schemas/Dev'
import config from './config'
import { secret } from './secrets'
import { loadDefaultPrompt } from '../helpers/promptLoader'

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

    // Merge with config (DB takes precedence, then config.ts for model/tokens/timeout, then defaults)
    const geminiKey = secret.GEMINI_KEY || ''
    if (!geminiKey && this.cache.globallyEnabled) {
      throw new Error(
        'GEMINI_KEY environment variable is required when AI is enabled'
      )
    }

    // Priority: DB > defaults (config.ts only for model/tokens/timeout fallback)
    const defaultPrompt = loadDefaultPrompt()
    const aiConfig = {
      globallyEnabled:
        this.cache.globallyEnabled !== undefined
          ? this.cache.globallyEnabled
          : false,
      model: this.cache.model || config.AI.MODEL || 'gemini-flash-latest',
      maxTokens: this.cache.maxTokens || config.AI.MAX_TOKENS || 1024,
      timeoutMs: this.cache.timeoutMs || config.AI.TIMEOUT_MS || 20000,
      systemPrompt: this.cache.systemPrompt || defaultPrompt,
      temperature:
        this.cache.temperature !== undefined
          ? this.cache.temperature
          : (this.parseTemperature(config.AI.TEMPERATURE.toString()) ?? 0.7),
      dmEnabledGlobally:
        this.cache.dmEnabledGlobally !== undefined
          ? this.cache.dmEnabledGlobally
          : (config.AI.DM_ENABLED_GLOBALLY ?? true),
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

  /**
   * Force immediate refresh of config from database
   * Bypasses TTL and fetches fresh data
   */
  async forceRefresh(): Promise<void> {
    this.cache = null
    this.lastFetch = 0
    // Pre-fetch to warm cache
    await this.getConfig()
  }
}

export const configCache = new ConfigCache()
