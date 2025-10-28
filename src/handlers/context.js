const { parsePermissions } = require('@helpers/Utils')
const { timeformat } = require('@helpers/Utils')
const Honeybadger = require('@helpers/Honeybadger')

const cooldownCache = new Map()

module.exports = {
  /**
   * @param {import('discord.js').ContextMenuInteraction} interaction
   * @param {import("@structures/BaseContext")} context
   */
  handleContext: async function (interaction, context) {
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
      if (!interaction.member.permissions.has(context.userPermissions)) {
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
      interaction.client.logger.error('contextRun', ex)

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
  },
}

/**
 * @param {string} memberId
 * @param {object} context
 */
function applyCooldown(memberId, context) {
  const key = context.name + '|' + memberId
  cooldownCache.set(key, Date.now())
}

/**
 * @param {string} memberId
 * @param {object} context
 */
function getRemainingCooldown(memberId, context) {
  const key = context.name + '|' + memberId
  if (cooldownCache.has(key)) {
    const remaining = (Date.now() - cooldownCache.get(key)) * 0.001
    if (remaining > context.cooldown) {
      cooldownCache.delete(key)
      return 0
    }
    return context.cooldown - remaining
  }
  return 0
}
