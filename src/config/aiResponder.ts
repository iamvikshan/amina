// @root/src/config/aiResponder.ts

// AiConfig type is globally available from types/global.d.ts
import { getAiConfig } from '@schemas/Dev'
import { secret } from './secrets'
import { config } from './config'

/** Shape of the raw DB document returned by getAiConfig() */
interface AiDbConfig {
  globallyEnabled: boolean
  model: string
  embeddingModel: string
  extractionModel: string
  maxTokens: number
  timeoutMs: number
  systemPrompt: string
  temperature: number
  dmEnabledGlobally: boolean
  dedupThreshold: number
}

class ConfigCache {
  private cache: AiDbConfig | null = null
  private lastFetch: number = 0
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  async getConfig(): Promise<AiConfig> {
    if (!this.cache || Date.now() - this.lastFetch > this.TTL) {
      const dbConfig = await getAiConfig()
      this.cache = dbConfig
      this.lastFetch = Date.now()
    }

    const cache = this.cache
    if (!cache) throw new Error('AI config cache is empty')

    const mistralApiKey = secret.MISTRAL || ''
    const groqApiKey = secret.GROQ || ''

    // Override stale Gemini model names persisted in DB
    const model =
      cache.model && !cache.model.startsWith('gemini')
        ? cache.model
        : config.AI.MODEL
    const embeddingModel =
      cache.embeddingModel && !cache.embeddingModel.startsWith('gemini')
        ? cache.embeddingModel
        : config.AI.EMBEDDING_MODEL
    const extractionModel =
      cache.extractionModel && !cache.extractionModel.startsWith('gemini')
        ? cache.extractionModel
        : config.AI.EXTRACTION_MODEL

    const aiConfig: AiConfig = {
      globallyEnabled: cache.globallyEnabled,
      model,
      embeddingModel,
      extractionModel,
      maxTokens: cache.maxTokens,
      timeoutMs: cache.timeoutMs,
      systemPrompt: cache.systemPrompt,
      temperature: cache.temperature,
      dmEnabledGlobally: cache.dmEnabledGlobally,
      dedupThreshold: cache.dedupThreshold ?? config.AI.DEDUP_THRESHOLD,
      mistralApiKey,
      groqApiKey: groqApiKey || undefined,
    }

    if (aiConfig.globallyEnabled) {
      if (!mistralApiKey)
        throw new Error('MISTRAL API key is required when AI is enabled')
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
   * Force immediate refresh of config from database.
   * Bypasses TTL and fetches fresh data.
   */
  async forceRefresh(): Promise<void> {
    this.cache = null
    this.lastFetch = 0
    await this.getConfig()
  }
}

export const configCache = new ConfigCache()
