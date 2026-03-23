// @root/src/services/ai/modelRouter.ts

import Logger from '@helpers/Logger'

/** Task types that can be dispatched to different models */
export type TaskType = 'chat' | 'embedding' | 'extraction'

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

  constructor(config: {
    model: string
    embeddingModel: string
    extractionModel: string
  }) {
    if (!config.model?.trim())
      throw new TypeError('model is required and cannot be empty')
    if (!config.embeddingModel?.trim())
      throw new TypeError('embeddingModel is required and cannot be empty')
    if (!config.extractionModel?.trim())
      throw new TypeError('extractionModel is required and cannot be empty')

    this.chatModel = config.model
    this.embeddingModel = config.embeddingModel
    this.extractionModel = config.extractionModel
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

      default:
        Logger.warn(
          `Unknown task type: ${taskType}, falling back to chat model`
        )
        return { model: this.chatModel, taskType: 'chat' }
    }
  }

  /**
   * Get a summary of current model routing for display
   */
  getRoutingSummary(): Record<TaskType, string> {
    return {
      chat: this.chatModel,
      embedding: this.embeddingModel,
      extraction: this.extractionModel,
    }
  }
}
