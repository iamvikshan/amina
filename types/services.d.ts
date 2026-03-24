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

  interface ToolCall {
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }

  interface FunctionDeclaration {
    name: string
    description: string
    parameters?: {
      type: string
      properties: Record<string, any>
      required?: string[]
    }
  }

  interface OpenAITool {
    type: 'function'
    function: FunctionDeclaration
  }

  interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string
    name?: string
    tool_calls?: ToolCall[]
    tool_call_id?: string
  }

  interface AiResponse {
    text: string
    tokensUsed: number
    promptTokens?: number
    completionTokens?: number
    latency: number
    toolCalls?: ToolCall[]
  }

  interface ExtractionResult {
    intent: string
    tools: Array<{ name: string; args: Record<string, any> }>
    memories: MemoryFact[]
    statusText: string
  }
}

export type {
  ChatMessage,
  ToolCall,
  FunctionDeclaration,
  OpenAITool,
  ExtractionResult,
}

