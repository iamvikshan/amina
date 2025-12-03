import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
  Client,
  Collection,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js'
import config from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import Utils from '@helpers/Utils'
import { getSettings } from '@schemas/Guild'
import Honeybadger from '@helpers/Honeybadger'
// CommandData is now globally available - see types/commands.d.ts

interface BotClient extends Client {
  slashCommands: Collection<string, CommandData>
  logger: {
    log: (message: string, ...args: any[]) => void
    error: (message: string, ...args: any[]) => void
    warn: (message: string, ...args: any[]) => void
    success: (message: string, ...args: any[]) => void
    debug: (message: string, ...args: any[]) => void
  }
}

const cooldownCache = new Map<string, number>()

export const handleSlashCommand = async (
  interaction: ChatInputCommandInteraction
): Promise<void> => {
  const client = interaction.client as BotClient
  const cmd = client.slashCommands.get(interaction.commandName) as
    | CommandData
    | undefined

  if (!cmd) {
    await interaction
      .reply({
        content:
          'IDK how this got here, but this command is currently disabled.',
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => {})
    return
  }

  // callback validations
  if (cmd.validations) {
    for (const validation of cmd.validations) {
      if (!validation.callback(interaction)) {
        await interaction.reply({
          content: validation.message,
          flags: MessageFlags.Ephemeral,
        })
        return
      }
    }
  }

  // DEV commands
  if (
    cmd.category === 'DEV' &&
    !config.BOT.DEV_IDS.includes(interaction.user.id)
  ) {
    await interaction.reply({
      content: `💔 Oh no! Only my sweet developers can use this command~!`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  // user permissions
  if (
    interaction.member &&
    cmd.userPermissions &&
    cmd.userPermissions.length > 0
  ) {
    const member = interaction.member as GuildMember
    if (!member.permissions.has(cmd.userPermissions)) {
      await interaction.reply({
        content: `💔 You need ${Utils.parsePermissions(cmd.userPermissions)} for this command, darling~!`,
        flags: MessageFlags.Ephemeral,
      })
      return
    }
  }

  // bot permissions (skip in DMs - no guild permissions)
  if (
    cmd.botPermissions &&
    cmd.botPermissions.length > 0 &&
    interaction.guild
  ) {
    if (!interaction.guild.members.me?.permissions.has(cmd.botPermissions)) {
      await interaction.reply({
        content: `😳 I need ${Utils.parsePermissions(cmd.botPermissions)} for this command, please~!`,
        flags: MessageFlags.Ephemeral,
      })
      return
    }
  }

  // cooldown check
  if (cmd.cooldown && cmd.cooldown > 0) {
    const remaining = getRemainingCooldown(interaction.user.id, cmd)
    if (remaining > 0) {
      await interaction.reply({
        content: `you're on cooldown ${interaction.user.displayName}, you can use the command again in \`${Utils.timeformat(remaining)}\`, you could use this time to touch grass, yk!`,
        flags: MessageFlags.Ephemeral,
      })
      return
    }
  }

  try {
    // Add a property to commands that show modals
    const showsModal = (cmd as any).showsModal
    if (!showsModal) {
      // Don't use ephemeral in DMs (it's just the user and bot)
      const useEphemeral = cmd.slashCommand.ephemeral && interaction.guild
      await interaction.deferReply({
        flags: useEphemeral ? MessageFlags.Ephemeral : undefined,
      })
    }

    // Set Honeybadger context for this command execution
    Honeybadger.setContext({
      command: cmd.name,
      category: cmd.category,
      guild_id: interaction.guild?.id,
      guild_name: interaction.guild?.name,
      channel_id: interaction.channel?.id,
      user_id: interaction.user.id,
      user_tag: interaction.user.tag,
    })

    // Only get settings if in a guild (skip in DMs)
    const settings = interaction.guild
      ? await getSettings(interaction.guild)
      : null
    await cmd.interactionRun(interaction, { settings })
  } catch (ex) {
    // Only follow up if we deferred
    const showsModal = (cmd as any).showsModal
    if (!showsModal) {
      await interaction.followUp(
        ':( Oops! An error occurred while running the command, this might be a bug, report it with the `/report` command or try again later~!'
      )
    }
    client.logger.error('interactionRun', ex)

    // Notify Honeybadger with command context
    Honeybadger.notify(ex, {
      context: {
        command: cmd.name,
        category: cmd.category,
      },
    })
  } finally {
    if (cmd.cooldown && cmd.cooldown > 0) {
      applyCooldown(interaction.user.id, cmd)
    }

    // Clear Honeybadger context after command execution
    Honeybadger.resetContext()
  }
}

export const getSlashUsage = (cmd: CommandData): EmbedBuilder => {
  let desc = ''

  if (
    cmd.slashCommand.options?.find(
      o => o.type === ApplicationCommandOptionType.Subcommand
    )
  ) {
    const subCmds = cmd.slashCommand.options.filter(
      opt => opt.type === ApplicationCommandOptionType.Subcommand
    )
    subCmds.forEach(sub => {
      desc += `\`/${cmd.name} ${sub.name}\`\n❯ ${sub.description}\n\n`
    })
  } else {
    desc += `\`/${cmd.name}\`\n\n**Help:** ${cmd.description}`
  }

  if (cmd.cooldown) {
    desc += `\n**Cooldown:** ${Utils.timeformat(cmd.cooldown)}`
  }

  return MinaEmbed.primary().setDescription(desc)
}

function applyCooldown(memberId: string, cmd: CommandData): void {
  const key = cmd.name + '|' + memberId
  cooldownCache.set(key, Date.now())
}

function getRemainingCooldown(memberId: string, cmd: CommandData): number {
  const key = cmd.name + '|' + memberId
  const timestamp = cooldownCache.get(key)

  if (timestamp) {
    const cooldown = cmd.cooldown || 0
    const remaining = (Date.now() - timestamp) * 0.001

    if (remaining > cooldown) {
      cooldownCache.delete(key)
      return 0
    }
    return cooldown - remaining
  }
  return 0
}

export default {
  handleSlashCommand,
  getSlashUsage,
}
