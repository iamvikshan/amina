// @root/src/commands/dev/sub/minaAi.ts

import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { updateAiConfig, getAiConfig } from '@schemas/Dev'
import { configCache } from '@src/config/aiResponder'
import { aiResponderService } from '@src/services/aiResponder'
import { EMBED_COLORS } from '@src/config'

export async function aiStatus(interaction: ChatInputCommandInteraction) {
  const config = await getAiConfig()

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🤖 Amina AI Configuration Status')
    .addFields(
      {
        name: '⚡ Global Status',
        value: config.globallyEnabled ? '✅ Enabled' : '❌ Disabled',
        inline: true,
      },
      {
        name: '🌐 DM Support',
        value: config.dmEnabledGlobally ? '✅ Enabled' : '❌ Disabled',
        inline: true,
      },
      {
        name: '🧠 Model',
        value: `\`${config.model}\``,
        inline: true,
      },
      {
        name: '📝 Max Tokens',
        value: `${config.maxTokens}`,
        inline: true,
      },
      {
        name: '⏱️ Timeout',
        value: `${config.timeoutMs}ms`,
        inline: true,
      },
      {
        name: '🌡️ Temperature',
        value: `${config.temperature}`,
        inline: true,
      },
      {
        name: '💬 System Prompt',
        value: config.systemPrompt
          ? `${config.systemPrompt.substring(0, 100)}${config.systemPrompt.length > 100 ? '...' : ''}`
          : 'Not set',
        inline: false,
      },
      {
        name: '📅 Last Updated',
        value: config.updatedAt
          ? `<t:${Math.floor(config.updatedAt.getTime() / 1000)}:R>`
          : 'Never',
        inline: true,
      },
      {
        name: '👤 Updated By',
        value: config.updatedBy ? `<@${config.updatedBy}>` : 'N/A',
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

  const embed = new EmbedBuilder()
    .setColor(enabled ? EMBED_COLORS.SUCCESS : EMBED_COLORS.WARNING)
    .setDescription(
      `✨ AI has been globally **${enabled ? 'enabled' : 'disabled'}**${enabled ? '!' : ' 🌙'}`
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

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(`🧠 Model updated to \`${model}\``)

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
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription('❌ Tokens must be between 100 and 4096')
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

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(`📝 Max tokens set to ${tokens}`)

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

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(
      `💬 System prompt updated!\n\n**New prompt:**\n${prompt.substring(0, 200)}${prompt.length > 200 ? '...' : ''}`
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

export async function setTemperature(
  interaction: ChatInputCommandInteraction,
  temperature: number
) {
  if (temperature < 0 || temperature > 2) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription('❌ Temperature must be between 0 and 2')
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

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(`🌡️ Temperature set to ${temperature}`)

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

  const embed = new EmbedBuilder()
    .setColor(enabled ? EMBED_COLORS.SUCCESS : EMBED_COLORS.WARNING)
    .setDescription(
      `📬 Global DM support **${enabled ? 'enabled' : 'disabled'}**`
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

export async function memoryStats(interaction: ChatInputCommandInteraction) {
  const memoryService = (await import('@src/services/memoryService'))
    .memoryService

  try {
    const stats = await memoryService.getStats()

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setTitle('🧠 Memory System Statistics')
      .addFields(
        {
          name: '📊 Total Memories',
          value: `${stats.totalMemories.toLocaleString()} stored`,
          inline: true,
        },
        {
          name: '👥 Unique Users',
          value: `${stats.uniqueUsers.toLocaleString()} tracked`,
          inline: true,
        },
        {
          name: '🏛️ Guilds',
          value: `${stats.uniqueGuilds.toLocaleString()} servers`,
          inline: true,
        },
        {
          name: '📝 By Type',
          value:
            Object.entries(stats.byType)
              .map(([type, count]) => `${type}: ${count}`)
              .join('\n') || 'No memories yet',
          inline: false,
        },
        {
          name: '🔝 Top Users',
          value:
            stats.topUsers.length > 0
              ? stats.topUsers
                  .map(
                    (u, i) => `${i + 1}. <@${u.userId}> - ${u.count} memories`
                  )
                  .join('\n')
              : 'No users yet',
          inline: false,
        },
        {
          name: '⭐ Average Importance',
          value: `${stats.avgImportance.toFixed(2)} / 5.0`,
          inline: true,
        },
        {
          name: '🎯 Total Access Count',
          value: `${stats.totalAccessCount.toLocaleString()} recalls`,
          inline: true,
        }
      )
      .setFooter({ text: 'Memory system powered by Upstash Vector + MongoDB' })
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
    const errorEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.ERROR)
      .setDescription(
        '❌ Failed to fetch memory statistics. Check logs for details.'
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
