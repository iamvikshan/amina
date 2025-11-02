import { parsePermissions, timeformat } from '@helpers/Utils'
import Honeybadger from '@helpers/Honeybadger'
import type { ContextMenuCommandInteraction } from 'discord.js'
import type { ContextData } from '@structures/BaseContext'

const cooldownCache = new Map<string, number>()

/**
 * Handle context menu command execution
 * @param interaction - The context menu interaction
 * @param context - The context command instance
 */
export async function handleContext(
  interaction: ContextMenuCommandInteraction,
  context: ContextData
): Promise<any> {
  // check cooldown
  if (context.cooldown) {
    const remaining = getRemainingCooldown(interaction.user.id, context)
    if (remaining > 0) {
      return interaction.reply({
        content: `You are on cooldown. You can again use the command after ${timeformat(remaining)}`,
        ephemeral: true,
      })
    }
  }

  // check user permissions
  if (
    interaction.member &&
    context.userPermissions &&
    context.userPermissions?.length > 0
  ) {
    if (!(interaction.member as any).permissions.has(context.userPermissions)) {
      return interaction.reply({
        content: `You need ${parsePermissions(context.userPermissions)} for this command`,
        ephemeral: true,
      })
    }
  }

  try {
    await interaction.deferReply({ ephemeral: context.ephemeral })

    // Set Honeybadger context
    Honeybadger.setContext({
      context_menu: context.name,
      context_type: context.type,
      guild_id: interaction.guild?.id,
      guild_name: interaction.guild?.name,
      user_id: interaction.user.id,
      user_tag: interaction.user.tag,
    })

    await context.run(interaction)
  } catch (ex) {
    interaction.followUp('Oops! An error occurred while running the command')
    ;(interaction.client as any).logger.error('contextRun', ex)

    // Notify Honeybadger
    Honeybadger.notify(ex, {
      context: {
        context_menu: context.name,
      },
    })
  } finally {
    applyCooldown(interaction.user.id, context)

    // Clear context
    Honeybadger.resetContext()
  }
}

/**
 * Apply cooldown for a user on a context command
 * @param memberId - The member ID
 * @param context - The context command instance
 */
function applyCooldown(memberId: string, context: ContextData): void {
  const key = context.name + '|' + memberId
  cooldownCache.set(key, Date.now())
}

/**
 * Get remaining cooldown time for a user on a context command
 * @param memberId - The member ID
 * @param context - The context command instance
 * @returns The remaining cooldown time in seconds
 */
function getRemainingCooldown(memberId: string, context: ContextData): number {
  const key = context.name + '|' + memberId
  if (cooldownCache.has(key)) {
    const timestamp = cooldownCache.get(key)
    const remaining = timestamp ? (Date.now() - timestamp) * 0.001 : 0
    if (remaining > (context.cooldown || 0)) {
      cooldownCache.delete(key)
      return 0
    }
    return (context.cooldown || 0) - remaining
  }
  return 0
}
