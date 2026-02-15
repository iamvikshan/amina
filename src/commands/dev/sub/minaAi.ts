// @root/src/commands/dev/sub/minaAi.ts

import { ChatInputCommandInteraction } from 'discord.js'
import { updateAiConfig, getAiConfig } from '@schemas/Dev'
import { configCache } from '@src/config/aiResponder'
import { aiResponderService } from '@src/services/aiResponder'
import { ModelRouter } from '@src/services/modelRouter'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import Logger from '@helpers/Logger'

export async function aiStatus(interaction: ChatInputCommandInteraction) {
  const config = await getAiConfig()

  // Get auth mode info - gracefully handle config cache errors
  let authModeDisplay: string
  let routingDisplay: Record<string, string>
  try {
    const fullConfig = await configCache.getConfig()
    authModeDisplay = `\`${fullConfig.authMode}\`${fullConfig.authMode === 'vertex' ? ` (${fullConfig.vertexRegion})` : ''}`
    const router = new ModelRouter({
      model: fullConfig.model,
      embeddingModel: fullConfig.embeddingModel,
      extractionModel: fullConfig.extractionModel,
    })
    routingDisplay = router.getRoutingSummary()
  } catch (err) {
    Logger.warn(
      `Failed to load AI config cache for status display: ${err instanceof Error ? err.message : String(err)}`
    )
    authModeDisplay = '`error loading config`'
    routingDisplay = {
      embedding: 'unknown',
      extraction: 'unknown',
      chat: 'unknown',
      reasoning: 'unknown',
    }
  }

  const embed = MinaEmbed.primary()
    .setTitle('amina ai configuration status')
    .addFields(
      {
        name: 'global status',
        value: config.globallyEnabled ? 'enabled' : 'disabled',
        inline: true,
      },
      {
        name: 'dm support',
        value: config.dmEnabledGlobally ? 'enabled' : 'disabled',
        inline: true,
      },
      {
        name: 'model',
        value: `\`${config.model}\``,
        inline: true,
      },
      {
        name: 'max tokens',
        value: `${config.maxTokens}`,
        inline: true,
      },
      {
        name: 'timeout',
        value: `${config.timeoutMs}ms`,
        inline: true,
      },
      {
        name: 'temperature',
        value: `${config.temperature}`,
        inline: true,
      },
      {
        name: 'auth mode',
        value: authModeDisplay,
        inline: true,
      },
      {
        name: 'embedding model',
        value: `\`${routingDisplay.embedding || 'unknown'}\``,
        inline: true,
      },
      {
        name: 'extraction model',
        value: `\`${routingDisplay.extraction || 'unknown'}\``,
        inline: true,
      },
      {
        name: 'system prompt',
        value: config.systemPrompt
          ? `${config.systemPrompt.substring(0, 100)}${config.systemPrompt.length > 100 ? '...' : ''}`
          : 'not set',
        inline: false,
      },
      {
        name: 'last updated',
        value: config.updatedAt
          ? `<t:${Math.floor(config.updatedAt.getTime() / 1000)}:R>`
          : 'never',
        inline: true,
      },
      {
        name: 'updated by',
        value: config.updatedBy ? `<@${config.updatedBy}>` : 'n/a',
        inline: true,
      }
    )

  // Use editReply if available (hub context), otherwise followUp (command context)
  if (
    'editReply' in interaction &&
    typeof interaction.editReply === 'function'
  ) {
    await interaction.editReply({ embeds: [embed] })
  } else {
    await interaction.followUp({ embeds: [embed] })
  }
}

export async function toggleGlobal(
  interaction: ChatInputCommandInteraction,
  enabled: boolean
) {
  await updateAiConfig({
    globallyEnabled: enabled,
    updatedBy: interaction.user.id,
  })
  await configCache.forceRefresh()

  // Re-initialize service (needed for globallyEnabled change)
  await aiResponderService.initialize()

  const embed = enabled ? MinaEmbed.success() : MinaEmbed.warning()
  embed.setDescription(
    `ai has been globally **${enabled ? 'enabled' : 'disabled'}**${enabled ? '!' : ''}`
  )

  // Use editReply if available (hub context), otherwise followUp (command context)
  if (
    'editReply' in interaction &&
    typeof interaction.editReply === 'function'
  ) {
    await interaction.editReply({ embeds: [embed] })
  } else {
    await interaction.followUp({ embeds: [embed] })
  }
}

export async function setModel(
  interaction: ChatInputCommandInteraction,
  model: string
) {
  await updateAiConfig({
    model,
    updatedBy: interaction.user.id,
  })
  await configCache.forceRefresh()

  // Re-initialize service (needed for model change)
  await aiResponderService.initialize()

  const embed = MinaEmbed.success().setDescription(
    `model updated to \`${model}\``
  )

  // Use editReply if available (hub context), otherwise followUp (command context)
  if (
    'editReply' in interaction &&
    typeof interaction.editReply === 'function'
  ) {
    await interaction.editReply({ embeds: [embed] })
  } else {
    await interaction.followUp({ embeds: [embed] })
  }
}

export async function setTokens(
  interaction: ChatInputCommandInteraction,
  tokens: number
) {
  if (tokens < 100 || tokens > 4096) {
    const embed = MinaEmbed.error().setDescription(
      'tokens must be between 100 and 4096'
    )
    // Use editReply if available (hub context), otherwise followUp (command context)
    if (
      'editReply' in interaction &&
      typeof interaction.editReply === 'function'
    ) {
      return interaction.editReply({ embeds: [embed] })
    } else {
      return interaction.followUp({ embeds: [embed] })
    }
  }

  await updateAiConfig({
    maxTokens: tokens,
    updatedBy: interaction.user.id,
  })
  await configCache.forceRefresh()
  // No re-initialization needed - maxTokens is used per-request

  const embed = MinaEmbed.success().setDescription(
    `max tokens set to ${tokens}`
  )

  // Use editReply if available (hub context), otherwise followUp (command context)
  if (
    'editReply' in interaction &&
    typeof interaction.editReply === 'function'
  ) {
    return interaction.editReply({ embeds: [embed] })
  } else {
    return interaction.followUp({ embeds: [embed] })
  }
}

export async function setPrompt(
  interaction: ChatInputCommandInteraction,
  prompt: string
) {
  await updateAiConfig({
    systemPrompt: prompt,
    updatedBy: interaction.user.id,
  })
  await configCache.forceRefresh()
  // No re-initialization needed - systemPrompt is passed per-request

  const embed = MinaEmbed.success().setDescription(
    `system prompt updated!\n\n**new prompt:**\n${prompt.substring(0, 200)}${prompt.length > 200 ? '...' : ''}`
  )

  // Use editReply if available (hub context), otherwise followUp (command context)
  if (
    'editReply' in interaction &&
    typeof interaction.editReply === 'function'
  ) {
    return interaction.editReply({ embeds: [embed] })
  } else {
    return interaction.followUp({ embeds: [embed] })
  }
}

export async function setTemperature(
  interaction: ChatInputCommandInteraction,
  temperature: number
) {
  if (temperature < 0 || temperature > 2) {
    const embed = MinaEmbed.error().setDescription(
      'temperature must be between 0 and 2'
    )
    // Use editReply if available (hub context), otherwise followUp (command context)
    if (
      'editReply' in interaction &&
      typeof interaction.editReply === 'function'
    ) {
      return interaction.editReply({ embeds: [embed] })
    } else {
      return interaction.followUp({ embeds: [embed] })
    }
  }

  await updateAiConfig({
    temperature,
    updatedBy: interaction.user.id,
  })
  await configCache.forceRefresh()
  // No re-initialization needed - temperature is used per-request

  const embed = MinaEmbed.success().setDescription(
    `temperature set to ${temperature}`
  )

  // Use editReply if available (hub context), otherwise followUp (command context)
  if (
    'editReply' in interaction &&
    typeof interaction.editReply === 'function'
  ) {
    return interaction.editReply({ embeds: [embed] })
  } else {
    return interaction.followUp({ embeds: [embed] })
  }
}

export async function toggleDm(
  interaction: ChatInputCommandInteraction,
  enabled: boolean
) {
  await updateAiConfig({
    dmEnabledGlobally: enabled,
    updatedBy: interaction.user.id,
  })
  await configCache.forceRefresh()
  // No re-initialization needed - dmEnabledGlobally is checked per-request

  const embed = enabled ? MinaEmbed.success() : MinaEmbed.warning()
  embed.setDescription(
    `global dm support **${enabled ? 'enabled' : 'disabled'}**`
  )

  // Use editReply if available (hub context), otherwise followUp (command context)
  if (
    'editReply' in interaction &&
    typeof interaction.editReply === 'function'
  ) {
    return interaction.editReply({ embeds: [embed] })
  } else {
    return interaction.followUp({ embeds: [embed] })
  }
}

export async function memoryStats(interaction: ChatInputCommandInteraction) {
  try {
    const { memoryService } = await import('@src/services/memoryService')
    const stats = await memoryService.getStats()

    const embed = MinaEmbed.primary()
      .setTitle('memory system statistics')
      .addFields(
        {
          name: 'total memories',
          value: `${stats.totalMemories.toLocaleString()} stored`,
          inline: true,
        },
        {
          name: 'unique users',
          value: `${stats.uniqueUsers.toLocaleString()} tracked`,
          inline: true,
        },
        {
          name: 'guilds',
          value: `${stats.uniqueGuilds.toLocaleString()} servers`,
          inline: true,
        },
        {
          name: 'by type',
          value:
            Object.entries(stats.byType)
              .map(([type, count]) => `${type}: ${count}`)
              .join('\n') || 'no memories yet',
          inline: false,
        },
        {
          name: 'top users',
          value:
            stats.topUsers.length > 0
              ? stats.topUsers
                  .map(
                    (u, i) => `${i + 1}. <@${u.userId}> - ${u.count} memories`
                  )
                  .join('\n')
              : 'no users yet',
          inline: false,
        },
        {
          name: 'average importance',
          value: `${stats.avgImportance.toFixed(2)} / 5.0`,
          inline: true,
        },
        {
          name: 'total access count',
          value: `${stats.totalAccessCount.toLocaleString()} recalls`,
          inline: true,
        }
      )
      .setFooter({
        text: 'memory system powered by mongodb atlas vector search',
      })
      .setTimestamp()

    // Use editReply if available (hub context), otherwise followUp (command context)
    if (
      'editReply' in interaction &&
      typeof interaction.editReply === 'function'
    ) {
      await interaction.editReply({ embeds: [embed] })
    } else {
      await interaction.followUp({ embeds: [embed] })
    }
  } catch (error) {
    Logger.error(
      'Failed to fetch memory statistics:',
      error instanceof Error ? error : new Error(String(error))
    )
    const errorEmbed = MinaEmbed.error().setDescription(
      'failed to fetch memory statistics. check logs for details.'
    )

    // Use editReply if available (hub context), otherwise followUp (command context)
    if (
      'editReply' in interaction &&
      typeof interaction.editReply === 'function'
    ) {
      await interaction.editReply({ embeds: [errorEmbed] })
    } else {
      await interaction.followUp({ embeds: [errorEmbed] })
    }
  }
}

export default 0
