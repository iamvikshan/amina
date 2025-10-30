import {
  EmbedBuilder,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
  Client,
  Collection,
} from 'discord.js'
import config from '@src/config'
import Utils from '@helpers/Utils'
import { getSettings } from '@schemas/Guild'
import Honeybadger from '@helpers/Honeybadger'
import type { CommandData } from '@structures/Command'

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
        ephemeral: true,
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
          ephemeral: true,
        })
        return
      }
    }
  }

  // DEV commands
  if (
    cmd.category === 'DEV' &&
    !process.env.DEV_ID.includes(interaction.user.id)
  ) {
    await interaction.reply({
      content: `💔 Oh no! Only my sweet developers can use this command~!`,
      ephemeral: true,
    })
    return
  }

  // user permissions
  if (interaction.member && cmd.userPermissions?.length > 0) {
    const member = interaction.member as GuildMember
    if (!member.permissions.has(cmd.userPermissions)) {
      await interaction.reply({
        content: `💔 You need ${Utils.parsePermissions(cmd.userPermissions)} for this command, darling~!`,
        ephemeral: true,
      })
      return
    }
  }

  // bot permissions
  if (cmd.botPermissions && cmd.botPermissions.length > 0) {
    if (!interaction.guild?.members.me?.permissions.has(cmd.botPermissions)) {
      await interaction.reply({
        content: `😳 I need ${Utils.parsePermissions(cmd.botPermissions)} for this command, please~!`,
        ephemeral: true,
      })
      return
    }
  }

  // cooldown check
  if (cmd.cooldown && cmd.cooldown > 0) {
    const remaining = getRemainingCooldown(interaction.user.id, cmd)
    if (remaining > 0) {
      await interaction.reply({
        content: `⏳ You're on cooldown, dear! You can use the command again in \`${Utils.timeformat(remaining)}\`, nya~!`,
        ephemeral: true,
      })
      return
    }
  }

  try {
    // Defer reply if command doesn't show a modal
    const showsModal = (cmd as any).showsModal
    if (!showsModal) {
      await interaction.deferReply({
        flags: cmd.slashCommand.ephemeral ? 64 : undefined, // MessageFlags.Ephemeral = 64
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

    const settings = await getSettings(interaction.guild)
    await cmd.interactionRun(interaction, { settings })
  } catch (ex) {
    // Only try to respond if we can and it's appropriate
    try {
      const showsModal = (cmd as any).showsModal
      // Only attempt to send error message if:
      // 1. Command doesn't show a modal
      // 2. Interaction was deferred but not yet replied to
      // 3. We're still within the 15-minute interaction window
      if (!showsModal && interaction.deferred && !interaction.replied) {
        await interaction.editReply(
          '😢 Oops! An error occurred while running the command, please try again later~!'
        )
      } else if (!interaction.replied && !interaction.deferred && !showsModal) {
        // Try to reply if we haven't deferred or replied yet
        await interaction.reply({
          content:
            '😢 Oops! An error occurred while running the command, please try again later~!',
          ephemeral: true,
        })
      }
    } catch (replyError) {
      // If we can't reply, just log it (interaction may have expired or been handled elsewhere)
      client.logger.error('Failed to send error message', replyError)
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
    Honeybadger.clear()
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

  return new EmbedBuilder()
    .setColor(config.EMBED_COLORS.BOT_EMBED)
    .setDescription(desc)
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
