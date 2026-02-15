// @root/src/config/aiResponder.ts

// AiConfig type is globally available from types/global.d.ts
import { getAiConfig } from '@schemas/Dev'
import { secret } from './secrets'
import { config } from './config'

/**
 * Validate a base64-encoded Google service account JSON.
 * Decodes, parses, and checks for required keys.
 * @returns The parsed service account object if valid
 * @throws Error with descriptive message if invalid
 */
export function validateServiceAccountJson(
  base64Json: string
): GoogleServiceAccountCredentials {
  // Buffer.from(str, 'base64') never throws — validate format first
  if (
    base64Json.length === 0 ||
    base64Json.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(base64Json)
  ) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON is not valid base64. ' +
        'Generate with: cat service-account.json | base64 -w 0'
    )
  }

  const decoded = Buffer.from(base64Json, 'base64').toString('utf-8')

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(decoded)
  } catch {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON decoded but is not valid JSON. ' +
        'Ensure you base64-encoded the raw JSON key file.'
    )
  }

  if (!parsed.client_email || typeof parsed.client_email !== 'string') {
    throw new Error(
      'Service account JSON is missing required field "client_email". ' +
        'Ensure you are encoding the full service account key file.'
    )
  }

  if (!parsed.private_key || typeof parsed.private_key !== 'string') {
    throw new Error(
      'Service account JSON is missing required field "private_key". ' +
        'Ensure you are encoding the full service account key file.'
    )
  }

  if (!parsed.project_id || typeof parsed.project_id !== 'string') {
    throw new Error(
      'Service account JSON is missing required field "project_id". ' +
        'Ensure you are encoding the full service account key file.'
    )
  }

  return parsed as GoogleServiceAccountCredentials
}

/**
 * Detect the auth mode based on available credentials.
 * Vertex AI is preferred when service account JSON and project ID are available.
 */
export function detectAuthMode(
  googleServiceAccountJson: string,
  vertexProjectId: string
): 'api-key' | 'vertex' {
  return googleServiceAccountJson && vertexProjectId ? 'vertex' : 'api-key'
}

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
}

class ConfigCache {
  private cache: AiDbConfig | null = null
  private lastFetch: number = 0
  private readonly TTL = 5 * 60 * 1000 // 5 minutes
  private parsedCreds: GoogleServiceAccountCredentials | null = null
  private lastSecretJson: string = '' // track secret changes

  async getConfig(): Promise<AiConfig> {
    // Fetch from MongoDB - schema defaults ensure all values exist
    if (!this.cache || Date.now() - this.lastFetch > this.TTL) {
      const dbConfig = await getAiConfig()
      this.cache = dbConfig
      this.lastFetch = Date.now()
    }

    const cache = this.cache
    if (!cache) {
      throw new Error('AI config cache is empty')
    }
    const geminiKey = secret.GEMINI_KEY || ''
    const googleServiceAccountJson = secret.GOOGLE_SERVICE_ACCOUNT_JSON || ''

    // Common config fields from DB
    const baseConfig = {
      globallyEnabled: cache.globallyEnabled,
      model: cache.model || config.AI.MODEL,
      embeddingModel: cache.embeddingModel || config.AI.EMBEDDING_MODEL,
      extractionModel: cache.extractionModel || config.AI.EXTRACTION_MODEL,
      maxTokens: cache.maxTokens,
      timeoutMs: cache.timeoutMs,
      systemPrompt: cache.systemPrompt,
      temperature: cache.temperature,
      dmEnabledGlobally: cache.dmEnabledGlobally,
    }

    // Validate common config when AI is enabled
    if (baseConfig.globallyEnabled) {
      if (!geminiKey && !googleServiceAccountJson) {
        throw new Error(
          'Either GEMINI_KEY or GOOGLE_SERVICE_ACCOUNT_JSON is required'
        )
      }
      if (!baseConfig.model) throw new Error('Model name is required')
      if (!baseConfig.systemPrompt) throw new Error('System prompt is required')
    }

    // Cache parsed credentials — only re-validate when secret changes
    let parsedCredentials: GoogleServiceAccountCredentials | undefined
    let vertexProjectId = secret.VERTEX_PROJECT_ID || ''
    const vertexRegion = secret.VERTEX_REGION || 'global'

    if (googleServiceAccountJson && baseConfig.globallyEnabled) {
      if (
        googleServiceAccountJson !== this.lastSecretJson ||
        !this.parsedCreds
      ) {
        this.parsedCreds = validateServiceAccountJson(googleServiceAccountJson)
        this.lastSecretJson = googleServiceAccountJson
      }
      parsedCredentials = this.parsedCreds
      if (!vertexProjectId) {
        vertexProjectId = parsedCredentials.project_id
      }
    }

    // Auto-detect auth mode using centralized logic;
    // Vertex requires globallyEnabled so parsedCredentials is guaranteed to be defined
    const authMode = detectAuthMode(googleServiceAccountJson, vertexProjectId)

    if (
      authMode === 'vertex' &&
      baseConfig.globallyEnabled &&
      parsedCredentials
    ) {
      return {
        ...baseConfig,
        authMode: 'vertex' as const,
        vertexProjectId,
        vertexRegion,
        googleServiceAccountJson,
        parsedCredentials,
        geminiKey: geminiKey || undefined,
      }
    }

    return {
      ...baseConfig,
      authMode: 'api-key' as const,
      geminiKey: geminiKey || undefined,
      vertexProjectId: vertexProjectId || undefined,
      vertexRegion,
      googleServiceAccountJson: googleServiceAccountJson || undefined,
    }
  }

  invalidate() {
    this.cache = null
    this.lastFetch = 0
    this.parsedCreds = null
    this.lastSecretJson = ''
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
