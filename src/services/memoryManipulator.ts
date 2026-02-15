// @root/src/services/memoryManipulator.ts

import type { MemoryService } from './memoryService'
import type { AiCommandRegistry, NativeToolContext } from './aiCommandRegistry'

// Tool declarations for memory manipulation
const MEMORY_TOOLS = [
  {
    name: 'remember_fact',
    description:
      'Store a new fact or piece of information about the user. Use when the user shares something worth remembering (preferences, facts about themselves, important details).',
    parameters: {
      type: 'OBJECT',
      properties: {
        fact: {
          type: 'STRING',
          description:
            'The fact or information to remember (e.g., "likes dogs", "is a software engineer")',
        },
        context: {
          type: 'STRING',
          description: 'Brief context about when/why this was shared',
        },
      },
      required: ['fact'],
    },
  },
  {
    name: 'update_memory',
    description:
      'Update an existing memory when the user corrects or changes a previously stored fact. Use when the user says things like "actually I prefer X now" or "I changed my mind about Y".',
    parameters: {
      type: 'OBJECT',
      properties: {
        description: {
          type: 'STRING',
          description:
            'Description of the memory to find and update (what was previously remembered)',
        },
        new_value: {
          type: 'STRING',
          description:
            'The new/updated information to replace the old memory with',
        },
      },
      required: ['description', 'new_value'],
    },
  },
  {
    name: 'forget_memory',
    description:
      'Delete a specific memory when the user asks to forget something. Use when the user says "forget that I like X" or "don\'t remember that anymore".',
    parameters: {
      type: 'OBJECT',
      properties: {
        description: {
          type: 'STRING',
          description: 'Description of the memory to find and delete',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'recall_memories',
    description:
      'Search and retrieve stored memories about a topic or the user. Use when you need to check what you remember about something specific.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'What to search for in stored memories',
        },
        limit: {
          type: 'INTEGER',
          description: 'Maximum number of memories to return (default: 5)',
        },
      },
      required: ['query'],
    },
  },
]

export class MemoryManipulator {
  private memoryService: MemoryService | null = null

  /**
   * Store a reference to the memory service for handler use.
   */
  initialize(memoryService: MemoryService) {
    this.memoryService = memoryService
  }

  /**
   * Register the 4 memory tools as native tools with the AI command registry.
   */
  registerTools(registry: AiCommandRegistry) {
    registry.registerNativeTools([
      {
        declaration: MEMORY_TOOLS[0],
        handler: this.handleRememberFact.bind(this),
      },
      {
        declaration: MEMORY_TOOLS[1],
        handler: this.handleUpdateMemory.bind(this),
      },
      {
        declaration: MEMORY_TOOLS[2],
        handler: this.handleForgetMemory.bind(this),
      },
      {
        declaration: MEMORY_TOOLS[3],
        handler: this.handleRecallMemories.bind(this),
      },
    ])
  }

  private async handleRememberFact(
    args: Record<string, unknown>,
    context: NativeToolContext
  ): Promise<string> {
    if (!this.memoryService) return 'Memory service is not available.'

    const fact = args.fact
    if (typeof fact !== 'string' || !fact.trim()) {
      return 'Error: "fact" is required and must be a non-empty string.'
    }
    const factContext = args.context
    if (factContext !== undefined && typeof factContext !== 'string') {
      return 'Error: "context" must be a string if provided.'
    }
    const ctxStr = (factContext as string) || 'shared in conversation'

    const stored = await this.memoryService.storeMemory(
      { key: 'user_fact', value: fact, importance: 6 },
      context.userId,
      context.guildId,
      ctxStr
    )

    if (stored) {
      return `Remembered: "${fact}"`
    }
    return 'Failed to store the memory. Please try again later.'
  }

  private async handleUpdateMemory(
    args: Record<string, unknown>,
    context: NativeToolContext
  ): Promise<string> {
    if (!this.memoryService) return 'Memory service is not available.'

    const description = args.description
    if (typeof description !== 'string' || !description.trim()) {
      return 'Error: "description" is required and must be a non-empty string.'
    }
    const newValue = args.new_value
    if (typeof newValue !== 'string' || !newValue.trim()) {
      return 'Error: "new_value" is required and must be a non-empty string.'
    }

    const result = await this.memoryService.updateMemoryByMatch(
      description,
      newValue,
      context.userId,
      context.guildId
    )

    if (result.found) {
      return `Updated memory: "${result.oldValue}" → "${result.newValue}"`
    }
    return `No matching memory found for "${description}". Nothing was updated.`
  }

  private async handleForgetMemory(
    args: Record<string, unknown>,
    context: NativeToolContext
  ): Promise<string> {
    if (!this.memoryService) return 'Memory service is not available.'

    const description = args.description
    if (typeof description !== 'string' || !description.trim()) {
      return 'Error: "description" is required and must be a non-empty string.'
    }

    const result = await this.memoryService.deleteMemoryByMatch(
      description,
      context.userId,
      context.guildId
    )

    if (result.found) {
      return `Forgot: "${result.deletedValue}"`
    }
    return `No matching memory found for "${description}". Nothing was deleted.`
  }

  private async handleRecallMemories(
    args: Record<string, unknown>,
    context: NativeToolContext
  ): Promise<string> {
    if (!this.memoryService) return 'Memory service is not available.'

    const query = args.query
    if (typeof query !== 'string' || !query.trim()) {
      return 'Error: "query" is required and must be a non-empty string.'
    }
    const rawLimit = typeof args.limit === 'number' ? args.limit : 5
    const limit = Math.max(1, Math.min(10, rawLimit))

    const memories = await this.memoryService.recallMemories(
      query,
      context.userId,
      context.guildId,
      limit
    )

    if (memories.length === 0) {
      return `No memories found matching "${query}".`
    }

    const formatted = memories
      .map(
        (m, i) =>
          `${i + 1}. ${m.key}: ${m.value} (relevance: ${(m.score * 100).toFixed(0)}%)`
      )
      .join('\n')

    return `Found ${memories.length} memories:\n${formatted}`
  }
}

// Singleton instance
export const memoryManipulator = new MemoryManipulator()
