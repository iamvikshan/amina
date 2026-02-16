// Service-related type definitions

declare global {
  type ResponseMode = 'dm' | 'mention' | 'freeWill' | false

  interface RateLimitEntry {
    timestamp: number
  }

  interface MemoryFact {
    key: string
    value: string
    importance: number
    memoryType?: 'user' | 'guild' | 'topic'
  }

  interface RecalledMemory {
    id: string | number
    key: string
    value: string
    score: number
    context: string
  }

  /**
   * Represents a single part of a Content message.
   * Matches the Google GenAI SDK Part shape.
   * Narrow via key-presence checks: 'text' in part, 'inlineData' in part, etc.
   * There is no conventional discriminant field; use type guards at runtime.
   */
  type ContentPart =
    | { text: string }
    | { inlineData: { data: string; mimeType: string } }
    | { functionCall: { name: string; args: Record<string, unknown> } }
    | { functionResponse: { name: string; response: Record<string, unknown> } }

  interface AiResponse {
    text: string
    tokensUsed: number
    promptTokens?: number
    completionTokens?: number
    latency: number
    functionCalls?: { name: string; args: Record<string, unknown> }[]
    modelContent?: ContentPart[] // Full model response parts for history preservation
  }

  interface ConversationMessage {
    role: 'user' | 'model'
    parts: ContentPart[]
  }
}

export type { ContentPart }

