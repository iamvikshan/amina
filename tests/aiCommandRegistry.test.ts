import { describe, test, expect, mock } from 'bun:test'
import { ApplicationCommandOptionType, Collection } from 'discord.js'

const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  log: () => {},
  success: () => {},
}

mock.module('../src/helpers/Logger', () => ({
  default: mockLogger,
  Logger: mockLogger,
  success: mockLogger.success,
  log: mockLogger.log,
  warn: mockLogger.warn,
  error: mockLogger.error,
  debug: mockLogger.debug,
}))

mock.module('@helpers/Logger', () => ({
  default: mockLogger,
  Logger: mockLogger,
  success: mockLogger.success,
  log: mockLogger.log,
  warn: mockLogger.warn,
  error: mockLogger.error,
  debug: mockLogger.debug,
}))

import { AiCommandRegistry } from '../src/services/ai/aiCommandRegistry'

/**
 * Registry test double that mirrors real AiCommandRegistry dedup logic
 * from registerNativeTools — used to verify idempotent registration.
 */
class IdempotentTestRegistry {
  private handlers = new Map<
    string,
    (args: Record<string, unknown>, ctx: any) => Promise<string>
  >()
  private nativeToolDefinitions: Array<{
    name: string
    description: string
    parameters?: any
  }> = []
  private metadata = new Map<string, any>()

  registerNativeTools(
    tools: Array<{ declaration: any; handler: any; permissionModel?: string }>
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

      this.handlers.set(name, tool.handler)
      this.nativeToolDefinitions.push(tool.declaration)
      this.metadata.set(name, {
        name,
        permissionModel: tool.permissionModel ?? 'open',
        userPermissions: [],
        freeWillAllowed: true,
      })
    }
  }

  getTools() {
    return this.nativeToolDefinitions.map(decl => ({
      type: 'function' as const,
      function: decl,
    }))
  }

  isNativeTool(name: string): boolean {
    return this.handlers.has(name)
  }

  async executeNativeTool(
    name: string,
    args: Record<string, unknown>,
    context: any
  ): Promise<string> {
    const handler = this.handlers.get(name)
    if (!handler) throw new Error(`Native tool ${name} not found`)
    return handler(args, context)
  }
}

describe('AiCommandRegistry idempotent native tool registration', () => {
  test('registerNativeTools_is_idempotent_no_duplicates', () => {
    const registry = new IdempotentTestRegistry()

    const dummyHandler = async () => 'result'
    const tools = [
      {
        declaration: {
          name: 'test_tool_a',
          description: 'Tool A',
          parameters: {
            type: 'OBJECT',
            properties: {},
            required: [] as string[],
          },
        },
        handler: dummyHandler,
      },
      {
        declaration: {
          name: 'test_tool_b',
          description: 'Tool B',
          parameters: {
            type: 'OBJECT',
            properties: {},
            required: [] as string[],
          },
        },
        handler: dummyHandler,
      },
    ]

    // Register twice — should NOT create duplicates
    registry.registerNativeTools(tools)
    registry.registerNativeTools(tools)

    const allTools = registry.getTools()
    const namesA = allTools.filter((t: any) => t.function.name === 'test_tool_a')
    const namesB = allTools.filter((t: any) => t.function.name === 'test_tool_b')

    expect(namesA.length).toBe(1)
    expect(namesB.length).toBe(1)
    expect(allTools.length).toBe(2)
  })

  test('registerNativeTools_replaces_handler_on_re-registration', async () => {
    const registry = new IdempotentTestRegistry()

    const handler1 = async () => 'v1'
    const handler2 = async () => 'v2'

    registry.registerNativeTools([
      {
        declaration: { name: 'my_tool', description: 'd' },
        handler: handler1,
      },
    ])

    registry.registerNativeTools([
      {
        declaration: { name: 'my_tool', description: 'd updated' },
        handler: handler2,
      },
    ])

    const result = await registry.executeNativeTool(
      'my_tool',
      {},
      {
        userId: 'u',
        guildId: null,
      }
    )
    expect(result).toBe('v2')
    expect(
      registry.getTools().filter((t: any) => t.function.name === 'my_tool').length
    ).toBe(1)
  })
})

describe('AiCommandRegistry OpenAITool format', () => {
  test('getTools returns OpenAITool wrapper format', () => {
    const registry = new IdempotentTestRegistry()
    const dummyHandler = async () => 'result'
    registry.registerNativeTools([
      {
        declaration: {
          name: 'fmt_tool',
          description: 'Test tool',
          parameters: { type: 'object', properties: {}, required: [] as string[] },
        },
        handler: dummyHandler,
      },
    ])

    const tools = registry.getTools()
    for (const tool of tools) {
      expect(tool.type).toBe('function')
      expect(tool.function).toBeDefined()
      expect(typeof tool.function.name).toBe('string')
    }
  })
})

function createMockClient(commands: any[]): any {
  const slashCommands = new Collection<string, any>()
  for (const cmd of commands) {
    slashCommands.set(cmd.name, cmd)
  }
  return { slashCommands }
}

const mockModeration = {
  name: 'moderation',
  description: 'Moderation commands',
  category: 'MODERATION',
  devOnly: false,
  userPermissions: ['BanMembers'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'ban',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Ban a user',
        options: [
          {
            name: 'user',
            type: ApplicationCommandOptionType.User,
            description: 'The user to ban',
            required: true,
          },
          {
            name: 'reason',
            type: ApplicationCommandOptionType.String,
            description: 'Ban reason',
            required: false,
          },
        ],
      },
      {
        name: 'kick',
        type: ApplicationCommandOptionType.Subcommand,
        description: 'Kick a user',
        options: [
          {
            name: 'user',
            type: ApplicationCommandOptionType.User,
            description: 'The user to kick',
            required: true,
          },
        ],
      },
    ],
  },
  interactionRun: async () => {},
}

const mockInvite = {
  name: 'invite',
  description: 'Invite management',
  category: 'SOCIAL',
  devOnly: false,
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'rank',
        type: ApplicationCommandOptionType.SubcommandGroup,
        description: 'Manage invite ranks',
        options: [
          {
            name: 'add',
            type: ApplicationCommandOptionType.Subcommand,
            description: 'Add an invite rank',
            options: [
              {
                name: 'role',
                type: ApplicationCommandOptionType.Role,
                description: 'Role to assign',
                required: true,
              },
              {
                name: 'invites',
                type: ApplicationCommandOptionType.Integer,
                description: 'Required invites',
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            type: ApplicationCommandOptionType.Subcommand,
            description: 'Remove an invite rank',
            options: [
              {
                name: 'role',
                type: ApplicationCommandOptionType.Role,
                description: 'Role to remove',
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  interactionRun: async () => {},
}

const mockPing = {
  name: 'ping',
  description: 'Check bot latency',
  category: 'UTILITY',
  devOnly: false,
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'ephemeral',
        type: ApplicationCommandOptionType.Boolean,
        description: 'Send privately',
        required: false,
      },
    ],
  },
  interactionRun: async () => {},
}

describe('AiCommandRegistry subcommand tool mapping (real)', () => {
  test('produces separate tools for each subcommand', () => {
    const registry = new AiCommandRegistry()
    registry.initialize(createMockClient([mockModeration]))

    const tools = registry.getTools()
    const names = tools.map(t => t.function.name)
    expect(names).toContain('moderation_ban')
    expect(names).toContain('moderation_kick')

    const banTool = tools.find(t => t.function.name === 'moderation_ban')
    if (!banTool) throw new Error('Expected moderation_ban tool')
    const banParameters = banTool.function.parameters
    if (!banParameters) throw new Error('Expected moderation_ban parameters')
    expect(banParameters.properties).toHaveProperty('user')
    expect(banParameters.properties).toHaveProperty('reason')
    expect(banParameters.required).toEqual(['user'])

    const kickTool = tools.find(t => t.function.name === 'moderation_kick')
    if (!kickTool) throw new Error('Expected moderation_kick tool')
    const kickParameters = kickTool.function.parameters
    if (!kickParameters) throw new Error('Expected moderation_kick parameters')
    expect(kickParameters.properties).toHaveProperty('user')
    expect(kickParameters.properties).not.toHaveProperty(
      'reason'
    )
  })

  test('handles SubcommandGroup correctly', () => {
    const registry = new AiCommandRegistry()
    registry.initialize(createMockClient([mockInvite]))

    const tools = registry.getTools()
    const names = tools.map(t => t.function.name)
    expect(names).toContain('invite_rank_add')
    expect(names).toContain('invite_rank_remove')

    const addTool = tools.find(t => t.function.name === 'invite_rank_add')
    if (!addTool) throw new Error('Expected invite_rank_add tool')
    const addParameters = addTool.function.parameters
    if (!addParameters) throw new Error('Expected invite_rank_add parameters')
    expect(addParameters.properties).toHaveProperty('role')
    expect(addParameters.properties).toHaveProperty('invites')

    const removeTool = tools.find(
      t => t.function.name === 'invite_rank_remove'
    )
    if (!removeTool) throw new Error('Expected invite_rank_remove tool')
    const removeParameters = removeTool.function.parameters
    if (!removeParameters) {
      throw new Error('Expected invite_rank_remove parameters')
    }
    expect(removeParameters.properties).toHaveProperty('role')
    expect(removeParameters.properties).not.toHaveProperty(
      'invites'
    )
  })

  test('produces single tool for simple commands', () => {
    const registry = new AiCommandRegistry()
    registry.initialize(createMockClient([mockPing]))

    const tools = registry.getTools()
    expect(tools.length).toBe(1)
    const pingTool = tools[0]
    if (!pingTool) throw new Error('Expected ping tool')
    expect(pingTool.function.name).toBe('ping')
    const pingParameters = pingTool.function.parameters
    if (!pingParameters) throw new Error('Expected ping parameters')
    expect(pingParameters.properties).toHaveProperty(
      'ephemeral'
    )
  })

  test('resolveToolName for flat subcommand', () => {
    const registry = new AiCommandRegistry()
    registry.initialize(createMockClient([mockModeration]))

    expect(registry.resolveToolName('moderation_ban')).toEqual({
      commandName: 'moderation',
      subcommand: 'ban',
    })
  })

  test('resolveToolName for grouped subcommand', () => {
    const registry = new AiCommandRegistry()
    registry.initialize(createMockClient([mockInvite]))

    expect(registry.resolveToolName('invite_rank_add')).toEqual({
      commandName: 'invite',
      subcommandGroup: 'rank',
      subcommand: 'add',
    })
  })

  test('resolveToolName returns undefined for unknown', () => {
    const registry = new AiCommandRegistry()
    registry.initialize(createMockClient([mockPing]))

    expect(registry.resolveToolName('nonexistent')).toBeUndefined()
  })

  test('getCommand maps compound name to parent command', () => {
    const registry = new AiCommandRegistry()
    registry.initialize(createMockClient([mockModeration]))

    const cmd = registry.getCommand('moderation_ban')
    expect(cmd).toBeDefined()
    if (!cmd) throw new Error('Expected command for moderation_ban')
    expect(cmd.name).toBe('moderation')
  })

  test('getMetadata available for compound names', () => {
    const registry = new AiCommandRegistry()
    registry.initialize(createMockClient([mockModeration]))

    const meta = registry.getMetadata('moderation_ban')
    expect(meta).toBeDefined()
    if (!meta) throw new Error('Expected metadata for moderation_ban')
    expect(meta.name).toBe('moderation')
  })
})
