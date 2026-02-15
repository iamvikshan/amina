// @root/src/services/modelRouter.ts

import Logger from '../helpers/Logger'

/** Task types that can be dispatched to different models */
export type TaskType = 'chat' | 'embedding' | 'extraction' | 'reasoning'

/** Model configuration returned by the router */
export interface ModelConfig {
  model: string
  taskType: TaskType
}

/**
 * Routes AI task types to the appropriate model identifiers.
 * Uses AiConfig from the config cache as the source of truth.
 */
export class ModelRouter {
  private chatModel: string
  private embeddingModel: string
  private extractionModel: string
  private reasoningModel: string | null // null = not configured, fall back to chat model

  constructor(config: {
    model: string
    embeddingModel: string
    extractionModel: string
    reasoningModel?: string | null
  }) {
    if (!config.model?.trim())
      throw new TypeError('model is required and cannot be empty')
    if (!config.embeddingModel?.trim())
      throw new TypeError('embeddingModel is required and cannot be empty')
    if (!config.extractionModel?.trim())
      throw new TypeError('extractionModel is required and cannot be empty')
    if (
      config.reasoningModel !== undefined &&
      config.reasoningModel !== null &&
      !config.reasoningModel.trim()
    ) {
      throw new TypeError(
        'reasoningModel cannot be an empty string when provided'
      )
    }
    this.chatModel = config.model
    this.embeddingModel = config.embeddingModel
    this.extractionModel = config.extractionModel
    this.reasoningModel = config.reasoningModel ?? null
  }

  /**
   * Get the model ID for a given task type
   */
  getModel(taskType: TaskType): ModelConfig {
    switch (taskType) {
      case 'chat':
        return { model: this.chatModel, taskType }
      case 'embedding':
        return { model: this.embeddingModel, taskType }
      case 'extraction':
        return { model: this.extractionModel, taskType }
      case 'reasoning':
        // Fall back to chat model if reasoning model not configured
        return {
          model: this.reasoningModel ?? this.chatModel,
          taskType,
        }
      default:
        Logger.warn(
          `Unknown task type: ${taskType}, falling back to chat model`
        )
        return { model: this.chatModel, taskType: 'chat' }
    }
  }

  /**
   * Check if a model ID is a Claude model (for routing to ClaudeClient)
   */
  static isClaudeModel(modelId: string | null | undefined): boolean {
    if (!modelId || typeof modelId !== 'string') return false
    return modelId.toLowerCase().startsWith('claude-')
  }

  /**
   * Check if a dedicated reasoning model is configured
   */
  hasReasoningModel(): boolean {
    return this.reasoningModel !== null
  }

  /**
   * Get a summary of current model routing for display
   */
  getRoutingSummary(): Record<TaskType, string> {
    return {
      chat: this.chatModel,
      embedding: this.embeddingModel,
      extraction: this.extractionModel,
      reasoning: this.reasoningModel ?? `${this.chatModel} (fallback)`,
    }
  }
}
