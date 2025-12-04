// @root/src/config/aiResponder.ts

// AiConfig type is globally available from types/global.d.ts
import { getAiConfig } from '../database/schemas/Dev'
import { secret } from './secrets'

class ConfigCache {
  private cache: any = null
  private lastFetch: number = 0
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  async getConfig(): Promise<AiConfig> {
    // Fetch from MongoDB - schema defaults ensure all values exist
    if (!this.cache || Date.now() - this.lastFetch > this.TTL) {
      const dbConfig = await getAiConfig()
      this.cache = dbConfig
      this.lastFetch = Date.now()
    }

    const geminiKey = secret.GEMINI_KEY || ''
    if (!geminiKey && this.cache.globallyEnabled) {
      throw new Error(
        'GEMINI_KEY environment variable is required when AI is enabled'
      )
    }

    // DB is the single source of truth - config.ts values seed the DB on first run
    const aiConfig: AiConfig = {
      globallyEnabled: this.cache.globallyEnabled,
      model: this.cache.model,
      maxTokens: this.cache.maxTokens,
      timeoutMs: this.cache.timeoutMs,
      systemPrompt: this.cache.systemPrompt,
      temperature: this.cache.temperature,
      dmEnabledGlobally: this.cache.dmEnabledGlobally,
      geminiKey,
      upstashUrl: this.cache.upstashUrl,
      upstashToken: secret.UPSTASH_VECTOR || '',
    }

    // Validate config when AI is enabled
    if (aiConfig.globallyEnabled) {
      if (!aiConfig.geminiKey) throw new Error('GEMINI_KEY is required')
      if (!aiConfig.upstashToken)
        throw new Error('UPSTASH_VECTOR token is required')
      if (!aiConfig.model) throw new Error('Model name is required')
      if (!aiConfig.systemPrompt) throw new Error('System prompt is required')
    }

    return aiConfig
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
