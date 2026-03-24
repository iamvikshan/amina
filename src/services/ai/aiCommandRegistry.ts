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
  private subcommandMap: Map<
    string,
    {
      commandName: string
      subcommand?: string
      subcommandGroup?: string
    }
  > = new Map()
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
    this.subcommandMap.clear()
    this.toolDefinitions = [...this.nativeToolDefinitions]
    this.toolMetadata = new Map(this.nativeToolMetadata)

    this.client.slashCommands.forEach(cmd => {
      if (!this.isCommandAllowed(cmd)) return

      const tools = this.mapCommandToTools(cmd)
      const metadata = this.buildMetadata(cmd)
      for (const tool of tools) {
        this.toolDefinitions.push(tool)
        this.commandCache.set(tool.name, cmd)
        this.toolMetadata.set(tool.name, metadata)
      }
    })
  }

  getTools(): OpenAITool[] {
    return this.toolDefinitions.map(decl => ({
      type: 'function' as const,
      function: decl,
    }))
  }

  getCommand(name: string): CommandData | undefined {
    return this.commandCache.get(name)
  }

  getMetadata(name: string): AiToolMetadata | undefined {
    return this.toolMetadata.get(name)
  }

  resolveToolName(compoundName: string):
    | {
        commandName: string
        subcommand?: string
        subcommandGroup?: string
      }
    | undefined {
    return this.subcommandMap.get(compoundName)
  }

  /**
   * Register native tools (not backed by slash commands)
   * @param tools
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
   * @param name
   */
  isNativeTool(name: string): boolean {
    return this.nativeToolHandlers.has(name)
  }

  /**
   * Execute a native tool by name
   * @param name
   * @param args
   * @param context
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
   * @param cmd
   */
  private getPermissionModel(cmd: CommandData): PermissionModel {
    const { overrides } = aiPermissions

    // Auto-derive: commands with userPermissions are privileged
    if (cmd.userPermissions && cmd.userPermissions.length > 0) {
      return 'privileged'
    }

    // Explicit override: commands that should be privileged despite no userPermissions
    if (overrides.privileged.includes(cmd.name)) {
      return 'privileged'
    }

    // Explicit override: commands requiring user intent (financial risk, destructive)
    if (overrides.userRequestOnly.includes(cmd.name)) {
      return 'userRequest'
    }

    // Default: open (safe because devOnly/DEV/ADMIN already filtered by isCommandAllowed)
    return 'open'
  }

  /**
   * Build metadata for a command
   * @param cmd
   */
  private buildMetadata(cmd: CommandData): AiToolMetadata {
    const permissionModel = this.getPermissionModel(cmd)
    const { freeWill } = aiPermissions

    const freeWillAllowed =
      permissionModel === 'open' ||
      (permissionModel === 'privileged' &&
        freeWill.exceptions.includes(cmd.name))

    return {
      name: cmd.name,
      permissionModel,
      userPermissions: cmd.userPermissions || [],
      freeWillAllowed,
    }
  }

  private isCommandAllowed(cmd: CommandData): boolean {
    const { categories } = aiPermissions

    // Never register dev-only commands
    if (cmd.devOnly) return false

    // Never register commands from forbidden categories
    if (categories.neverRegister.includes(cmd.category)) return false

    // Only allow commands from allowed categories
    if (!categories.allowed.includes(cmd.category)) return false

    // Check explicit disable
    if (cmd.slashCommand.enabled === false) return false

    return true
  }

  private mapCommandToTools(cmd: CommandData): FunctionDeclaration[] {
    try {
      const results: FunctionDeclaration[] = []
      const options = cmd.slashCommand.options || []

      const hasSubcommands = options.some(
        o =>
          o.type === ApplicationCommandOptionType.Subcommand ||
          o.type === ApplicationCommandOptionType.SubcommandGroup
      )

      if (!hasSubcommands) {
        const properties: Record<string, any> = {}
        const required: string[] = []
        for (const option of options) {
          this.mapOption(option, properties, required)
        }
        results.push({
          name: cmd.name,
          description: cmd.description.substring(0, 1024),
          parameters: {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined,
          },
        })
        return results
      }

      for (const option of options) {
        if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
          for (const subOption of option.options || []) {
            if (subOption.type === ApplicationCommandOptionType.Subcommand) {
              const compoundName = `${cmd.name}_${option.name}_${subOption.name}`
              const properties: Record<string, any> = {}
              const required: string[] = []
              for (const subOpt of subOption.options || []) {
                this.mapOption(subOpt, properties, required)
              }
              results.push({
                name: compoundName,
                description:
                  `${cmd.description} - ${option.name} ${subOption.name}`.substring(
                    0,
                    1024
                  ),
                parameters: {
                  type: 'object',
                  properties,
                  required: required.length > 0 ? required : undefined,
                },
              })
              this.subcommandMap.set(compoundName, {
                commandName: cmd.name,
                subcommandGroup: option.name,
                subcommand: subOption.name,
              })
            }
          }
        } else if (option.type === ApplicationCommandOptionType.Subcommand) {
          const compoundName = `${cmd.name}_${option.name}`
          const properties: Record<string, any> = {}
          const required: string[] = []
          for (const subOpt of option.options || []) {
            this.mapOption(subOpt, properties, required)
          }
          results.push({
            name: compoundName,
            description: `${cmd.description} - ${option.name}`.substring(
              0,
              1024
            ),
            parameters: {
              type: 'object',
              properties,
              required: required.length > 0 ? required : undefined,
            },
          })
          this.subcommandMap.set(compoundName, {
            commandName: cmd.name,
            subcommand: option.name,
          })
        }
      }

      return results
    } catch (error) {
      Logger.error(`Failed to map command ${cmd.name} to AI tools`, error)
      return []
    }
  }

  private mapOption(
    option: any,
    properties: Record<string, any>,
    required: string[]
  ) {
    const typeMap: Record<number, string> = {
      [ApplicationCommandOptionType.String]: 'string',
      [ApplicationCommandOptionType.Integer]: 'integer',
      [ApplicationCommandOptionType.Boolean]: 'boolean',
      [ApplicationCommandOptionType.User]: 'string',
      [ApplicationCommandOptionType.Channel]: 'string',
      [ApplicationCommandOptionType.Role]: 'string',
      [ApplicationCommandOptionType.Mentionable]: 'string',
      [ApplicationCommandOptionType.Number]: 'number',
    }

    const aiType = typeMap[option.type] || 'string'

    properties[option.name] = {
      type: aiType,
      description: option.description,
    }

    if (option.required && !required.includes(option.name)) {
      required.push(option.name)
    }
  }
}

export const aiCommandRegistry = new AiCommandRegistry()
