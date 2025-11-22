import { ApplicationCommandOptionType } from 'discord.js'
import type { BotClient } from '@src/structures'

// Type definitions for Google AI Tools
// We define them here to avoid direct dependency on the google-ai package in this file if possible,
// or we can import them if we want strict typing.
// For now, we'll match the structure expected by the GoogleAiClient.

interface FunctionDeclaration {
  name: string
  description: string
  parameters?: {
    type: string // 'OBJECT'
    properties: Record<string, any>
    required?: string[]
  }
}

export class AiCommandRegistry {
  private client: BotClient | null = null
  private allowedCategories = [
    'FUN',
    'UTILITY',
    'MODERATION',
    'INFO',
    'ECONOMY',
  ]
  private commandCache: Map<string, CommandData> = new Map()
  private toolDefinitions: FunctionDeclaration[] = []

  initialize(client: BotClient) {
    this.client = client
    this.refreshRegistry()
  }

  refreshRegistry() {
    if (!this.client) return

    this.commandCache.clear()
    this.toolDefinitions = []

    this.client.slashCommands.forEach(cmd => {
      // Filter commands
      if (!this.isCommandAllowed(cmd)) return

      // Map to Google AI Tool
      const tool = this.mapCommandToTool(cmd)
      if (tool) {
        this.toolDefinitions.push(tool)
        this.commandCache.set(cmd.name, cmd)
      }
    })

    console.log(
      `[AiCommandRegistry] Registered ${this.toolDefinitions.length} AI tools`
    )
  }

  getTools(): FunctionDeclaration[] {
    return this.toolDefinitions
  }

  getCommand(name: string): CommandData | undefined {
    return this.commandCache.get(name)
  }

  private isCommandAllowed(cmd: CommandData): boolean {
    // Check category
    if (!this.allowedCategories.includes(cmd.category)) return false

    // Check explicit disable
    if (cmd.slashCommand.enabled === false) return false

    // Skip dev/admin commands for safety (unless explicitly allowed later)
    if (cmd.category === 'ADMIN' || cmd.category === 'DEV') return false

    return true
  }

  private mapCommandToTool(cmd: CommandData): FunctionDeclaration | null {
    try {
      const properties: Record<string, any> = {}
      const required: string[] = []

      // Handle options
      if (cmd.slashCommand.options) {
        for (const option of cmd.slashCommand.options) {
          // Handle Subcommands
          if (option.type === ApplicationCommandOptionType.Subcommand) {
            // For subcommands, we might need a different strategy.
            // Simple strategy: Add a 'subcommand' argument that is an enum of available subcommands
            // But the structure of options changes based on subcommand.
            // For now, let's skip complex subcommand structures or flatten them if possible.
            // A better approach for Google AI is to register "command_subcommand" as the function name
            // OR just register the top level and let the AI figure out the 'subcommand' string argument.

            // We will add a 'subcommand' property if it doesn't exist
            if (!properties['subcommand']) {
              properties['subcommand'] = {
                type: 'STRING',
                description: 'The specific operation to perform',
                enum: [],
              }
              required.push('subcommand')
            }
            properties['subcommand'].enum.push(option.name)

            // We also need to map the subcommand's options.
            // This gets tricky with naming collisions.
            // For simplicity in V1, we'll merge all unique option names across subcommands.
            if (option.options) {
              for (const subOpt of option.options) {
                this.mapOption(subOpt, properties, required)
              }
            }
          } else {
            this.mapOption(option, properties, required)
          }
        }
      }

      return {
        name: cmd.name,
        description: cmd.description.substring(0, 1024), // Limit description length
        parameters: {
          type: 'OBJECT',
          properties,
          required: required.length > 0 ? required : undefined,
        },
      }
    } catch (error) {
      console.error(`Failed to map command ${cmd.name} to AI tool:`, error)
      return null
    }
  }

  private mapOption(
    option: any,
    properties: Record<string, any>,
    required: string[]
  ) {
    const typeMap: Record<number, string> = {
      [ApplicationCommandOptionType.String]: 'STRING',
      [ApplicationCommandOptionType.Integer]: 'INTEGER',
      [ApplicationCommandOptionType.Boolean]: 'BOOLEAN',
      [ApplicationCommandOptionType.User]: 'STRING', // We want the ID
      [ApplicationCommandOptionType.Channel]: 'STRING', // We want the ID
      [ApplicationCommandOptionType.Role]: 'STRING', // We want the ID
      [ApplicationCommandOptionType.Mentionable]: 'STRING', // We want the ID
      [ApplicationCommandOptionType.Number]: 'NUMBER',
    }

    const aiType = typeMap[option.type] || 'STRING'

    properties[option.name] = {
      type: aiType,
      description: option.description,
    }

    if (option.required) {
      required.push(option.name)
    }
  }
}

export const aiCommandRegistry = new AiCommandRegistry()
