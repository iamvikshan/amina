import {
  ApplicationCommandOptionType,
  type PermissionResolvable,
} from 'discord.js'
import type { BotClient } from '@src/structures'
import { Logger } from '@helpers/Logger'
import aiPermissions from '@src/data/aiPermissions.json'

// Permission model types
type PermissionModel = 'open' | 'userRequest' | 'privileged'

// Metadata stored for each registered command
interface AiToolMetadata {
  name: string
  permissionModel: PermissionModel
  userPermissions: PermissionResolvable[]
  freeWillAllowed: boolean
}

// Type definitions for Google AI Tools
interface FunctionDeclaration {
  name: string
  description: string
  parameters?: {
    type: string // 'OBJECT'
    properties: Record<string, any>
    required?: string[]
  }
}

// Native tool types (for tools not backed by slash commands)
export type NativeToolHandler = (
  args: Record<string, unknown>,
  context: NativeToolContext
) => Promise<string>

export interface NativeToolContext {
  userId: string
  guildId: string | null
}

export class AiCommandRegistry {
  private client: BotClient | null = null
  private isInitialized: boolean = false
  private commandCache: Map<string, CommandData> = new Map()
  private toolDefinitions: FunctionDeclaration[] = []
  private toolMetadata: Map<string, AiToolMetadata> = new Map()
  private nativeToolHandlers: Map<string, NativeToolHandler> = new Map()
  private nativeToolDefinitions: FunctionDeclaration[] = []
  private nativeToolMetadata: Map<string, AiToolMetadata> = new Map()

  initialize(client: BotClient) {
    if (this.isInitialized) return // Already initialized

    this.client = client
    this.refreshRegistry()
    this.isInitialized = true
  }

  refreshRegistry() {
    if (!this.client) return

    // Clear only slash command entries; preserve native tools
    this.commandCache.clear()
    this.toolDefinitions = [...this.nativeToolDefinitions]
    this.toolMetadata = new Map(this.nativeToolMetadata)

    this.client.slashCommands.forEach(cmd => {
      // Filter commands
      if (!this.isCommandAllowed(cmd)) return

      // Map to Google AI Tool
      const tool = this.mapCommandToTool(cmd)
      if (tool) {
        this.toolDefinitions.push(tool)
        this.commandCache.set(cmd.name, cmd)

        // Store metadata for permission checking
        const metadata = this.buildMetadata(cmd)
        this.toolMetadata.set(cmd.name, metadata)
      }
    })
  }

  getTools(): FunctionDeclaration[] {
    return this.toolDefinitions
  }

  getCommand(name: string): CommandData | undefined {
    return this.commandCache.get(name)
  }

  getMetadata(name: string): AiToolMetadata | undefined {
    return this.toolMetadata.get(name)
  }

  /**
   * Register native tools (not backed by slash commands)
   */
  registerNativeTools(
    tools: Array<{
      declaration: FunctionDeclaration
      handler: NativeToolHandler
      permissionModel?: PermissionModel
    }>
  ) {
    for (const tool of tools) {
      const name = tool.declaration.name

      // Remove existing native tool definition with same name (idempotent)
      const existingIdx = this.nativeToolDefinitions.findIndex(
        d => d.name === name
      )
      if (existingIdx !== -1) {
        this.nativeToolDefinitions.splice(existingIdx, 1)
      }

      this.nativeToolHandlers.set(name, tool.handler)
      this.nativeToolDefinitions.push(tool.declaration)

      const metadata: AiToolMetadata = {
        name,
        permissionModel: tool.permissionModel ?? 'open',
        userPermissions: [],
        freeWillAllowed: true,
      }
      this.nativeToolMetadata.set(name, metadata)

      // Also update active definitions/metadata — remove old and add new
      const activeIdx = this.toolDefinitions.findIndex(d => d.name === name)
      if (activeIdx !== -1) {
        this.toolDefinitions.splice(activeIdx, 1)
      }
      this.toolDefinitions.push(tool.declaration)
      this.toolMetadata.set(name, metadata)
    }
  }

  /**
   * Check if a tool is a native tool (not a slash command)
   */
  isNativeTool(name: string): boolean {
    return this.nativeToolHandlers.has(name)
  }

  /**
   * Execute a native tool by name
   */
  async executeNativeTool(
    name: string,
    args: Record<string, unknown>,
    context: NativeToolContext
  ): Promise<string> {
    const handler = this.nativeToolHandlers.get(name)
    if (!handler) throw new Error(`Native tool ${name} not found`)
    return handler(args, context)
  }

  /**
   * Get permission model for a command
   */
  private getPermissionModel(cmd: CommandData): PermissionModel {
    const { commands } = aiPermissions

    // Check if command is in restricted list (should have been filtered already)
    if (commands.restricted.includes(cmd.name)) {
      return 'privileged' // Shouldn't reach here, but treat as most restrictive
    }

    // Check if command is in privileged list
    if (commands.privileged.includes(cmd.name)) {
      return 'privileged'
    }

    // Check if command is user-request only (e.g., gambling, music, economy)
    if (commands.userRequestOnly.includes(cmd.name)) {
      return 'userRequest'
    }

    // Check if command is explicitly open
    if (commands.open.includes(cmd.name)) {
      return 'open'
    }

    // Default: userRequest for safety (requires user to ask)
    // This ensures any command not explicitly classified defaults to safer behavior
    return 'userRequest'
  }

  /**
   * Build metadata for a command
   */
  private buildMetadata(cmd: CommandData): AiToolMetadata {
    const permissionModel = this.getPermissionModel(cmd)
    const { commands } = aiPermissions

    // Check if this privileged command has free will exception (e.g., timeout)
    const freeWillAllowed =
      permissionModel === 'open' ||
      (permissionModel === 'privileged' &&
        commands.freeWillExceptions.includes(cmd.name))

    return {
      name: cmd.name,
      permissionModel,
      userPermissions: cmd.userPermissions || [],
      freeWillAllowed,
    }
  }

  private isCommandAllowed(cmd: CommandData): boolean {
    const { categories, commands } = aiPermissions

    // Never register restricted commands (dev commands)
    if (commands.restricted.includes(cmd.name)) return false

    // Never register commands from forbidden categories
    if (categories.neverRegister.includes(cmd.category)) return false

    // Only allow commands from allowed categories
    if (!categories.allowed.includes(cmd.category)) return false

    // Check explicit disable
    if (cmd.slashCommand.enabled === false) return false

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
      Logger.error(`Failed to map command ${cmd.name} to AI tool`, error)
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
