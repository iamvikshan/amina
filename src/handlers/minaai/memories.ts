import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  User,
} from 'discord.js'
import { Model as AiMemoryModel } from '@src/database/schemas/AiMemory'
import Logger from '@helpers/Logger'
import {
  createSecondaryBtn,
  parseCustomIdState,
} from '@helpers/componentHelper'
import { postToBin } from '@helpers/HttpUtils'
import { showMinaAiHub } from './main-hub'

const logger = Logger

// Constants
const MEMORIES_PER_TYPE_PREVIEW = 2 // Number of memories to show per type in main view
const MEMORIES_PER_CATEGORY_PAGE = 5 // Number of memories per page in category detail view
const MAX_CATEGORY_PAGES = 2 // Maximum pages in category view before showing DM Me button

/**
 * Show memories view (server or DM)
 */
export async function showMemoriesView(
  interaction: StringSelectMenuInteraction | ButtonInteraction,
  memoryTypeParam?: 'server' | 'dm'
): Promise<void> {
  try {
    const userId = interaction.user.id
    const guildId = interaction.guildId || null

    // Parse state from custom_id or use parameter
    let memoryType: 'server' | 'dm' = 'server'
    let currentPage = 1

    if (memoryTypeParam) {
      // Called directly from menu selection
      memoryType = memoryTypeParam
    } else if (interaction.customId && interaction.customId.includes('|')) {
      // Button click with state
      const { state } = parseCustomIdState(interaction.customId)
      memoryType = (state.type as 'server' | 'dm') || 'server'
      currentPage = state.page ? parseInt(state.page, 10) : 1
    }

    // Build query based on type
    const query: any = { userId }
    if (memoryType === 'dm') {
      query.guildId = null // DM memories only
    } else {
      query.guildId = guildId // Server memories only
    }

    // Fetch all memories
    const memories = await AiMemoryModel.find(query)
      .sort({ importance: -1, lastAccessed: -1 })
      .limit(200)

    if (memories.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle(`🧠 Your ${memoryType === 'dm' ? 'DM' : 'Server'} Memories`)
        .setDescription(
          `I don't have any ${memoryType === 'dm' ? 'DM' : 'server'} memories about you yet. Chat with me more and I'll learn about you!\n\n` +
            '💡 **Note:** Memories cannot be manually edited. If you want to update or remove a memory, simply ask me in chat to forget something or remember something new!'
        )
        .setFooter({
          text: 'Use the menu to navigate back',
        })

      const backButton = createSecondaryBtn({
        customId: 'minaai:btn:back',
        label: 'Back to Main Menu',
        emoji: '◀️',
      })

      await interaction.editReply({
        embeds: [embed],
        components: [backButton],
      })
      return
    }

    // Group memories by type
    const byType: Record<string, typeof memories> = {}
    for (const memory of memories) {
      if (!byType[memory.memoryType]) {
        byType[memory.memoryType] = []
      }
      byType[memory.memoryType].push(memory)
    }

    // Get sorted memory types
    const memoryTypes = Object.keys(byType).sort((a, b) => {
      const aTotal = byType[a].reduce(
        (sum, m) => sum + m.importance + m.accessCount,
        0
      )
      const bTotal = byType[b].reduce(
        (sum, m) => sum + m.importance + m.accessCount,
        0
      )
      return bTotal - aTotal
    })

    // Build embed
    const embed = new EmbedBuilder()
      .setColor('#00aaff')
      .setTitle(
        `🧠 Your ${memoryType === 'dm' ? 'DM' : 'Server'} Memories (${memories.length} total)`
      )
      .setDescription(
        `Showing ${memoryType === 'dm' ? 'DM' : 'server'} memories.\n\n` +
          '💡 **Note:** Memories cannot be manually edited. If you want to update or remove a memory, simply ask me in chat to forget something or remember something new!'
      )
      .setFooter({
        text: '⭐ = importance • Use buttons to view categories',
      })

    // Add fields for each memory type (showing only 2 per type)
    const categoryButtons: ActionRowBuilder<ButtonBuilder>[] = []

    for (const type of memoryTypes) {
      const mems = byType[type]
      const previewMems = mems.slice(0, MEMORIES_PER_TYPE_PREVIEW)

      const lines = previewMems.map(m => {
        const stars = '⭐'.repeat(Math.min(m.importance, 3))
        const age = getRelativeTime(m.createdAt)
        return `${stars} **${m.key}**: ${m.value}\n_${age}_`
      })

      const remaining = mems.length - MEMORIES_PER_TYPE_PREVIEW
      if (remaining > 0) {
        lines.push(`_...and ${remaining} more ${type} memories_`)
      }

      embed.addFields({
        name: `${getTypeEmoji(type)} ${capitalizeFirst(type)} (${mems.length})`,
        value: lines.join('\n\n') || 'None',
        inline: false,
      })

      // Add category button (short name only)
      const categoryBtn = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(
            `minaai:btn:category|type:${type}|mem_type:${memoryType}|page:1`
          )
          .setLabel(`${capitalizeFirst(type)} (${mems.length})`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji(getTypeEmoji(type))
      )
      categoryButtons.push(categoryBtn)
    }

    // Add stats
    const totalAccess = memories.reduce((sum, m) => sum + m.accessCount, 0)
    const avgImportance = (
      memories.reduce((sum, m) => sum + m.importance, 0) / memories.length
    ).toFixed(1)

    embed.addFields({
      name: '📊 Stats',
      value: `Total access count: ${totalAccess}\nAverage importance: ${avgImportance}/5`,
      inline: false,
    })

    // Build custom_id helper
    const buildCustomId = (action: string, page: number) => {
      return `minaai:btn:${action}|type:${memoryType}|page:${page}`
    }

    // DM Me button - sends embed + pastebin link
    const dmMeButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(buildCustomId('dm_me', currentPage))
        .setLabel('DM Me')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📬')
    )

    // Back button
    const backButton = createSecondaryBtn({
      customId: 'minaai:btn:back',
      label: 'Back to Main Menu',
      emoji: '◀️',
    })

    // Combine components
    const components: ActionRowBuilder<ButtonBuilder>[] = []
    components.push(...categoryButtons)
    components.push(dmMeButton)
    components.push(backButton)

    await interaction.editReply({
      embeds: [embed],
      components,
    })

    logger.log(
      `User ${userId} viewed ${memoryType} memories (${memories.length} total) in guild ${guildId}`
    )
  } catch (error) {
    logger.error(
      `Error fetching user memories: ${(error as Error).message}`,
      error as Error
    )

    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Error')
      .setDescription(
        'Failed to fetch memories. Please try again later or contact support.'
      )

    const backButton = createSecondaryBtn({
      customId: 'minaai:btn:back',
      label: 'Back to Main Menu',
      emoji: '◀️',
    })

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [backButton],
    })
  }
}

/**
 * Show category detail view - all memories of a specific type
 */
export async function showCategoryDetailView(
  interaction: ButtonInteraction
): Promise<void> {
  try {
    await interaction.deferUpdate()

    const userId = interaction.user.id
    const guildId = interaction.guildId || null

    // Parse state from custom_id
    const { state } = parseCustomIdState(interaction.customId)
    const categoryType = state.type || ''
    const memType = state.mem_type || 'server' // server or dm
    const currentPage = state.page ? parseInt(state.page, 10) : 1

    // Build query
    const query: any = { userId, memoryType: categoryType }
    if (memType === 'dm') {
      query.guildId = null
    } else {
      query.guildId = guildId
    }

    // Fetch all memories of this category
    const memories = await AiMemoryModel.find(query)
      .sort({ importance: -1, lastAccessed: -1 })
      .limit(200)

    if (memories.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#ffaa00')
        .setTitle(`🧠 ${capitalizeFirst(categoryType)} Memories`)
        .setDescription('No memories found in this category.')
        .setFooter({ text: 'Use the back button to return' })

      const backButton = createSecondaryBtn({
        customId: `minaai:btn:back_memories|type:${memType}|page:1`,
        label: 'Back to Main View',
        emoji: '◀️',
      })

      await interaction.editReply({
        embeds: [embed],
        components: [backButton],
      })
      return
    }

    // Calculate pagination (max 2 pages)
    const totalPages = Math.min(
      Math.ceil(memories.length / MEMORIES_PER_CATEGORY_PAGE),
      MAX_CATEGORY_PAGES
    )
    const startIndex = (currentPage - 1) * MEMORIES_PER_CATEGORY_PAGE
    const endIndex = startIndex + MEMORIES_PER_CATEGORY_PAGE
    const memoriesToShow = memories.slice(startIndex, endIndex)

    // Build embed
    const embed = new EmbedBuilder()
      .setColor('#00aaff')
      .setTitle(
        `🧠 ${capitalizeFirst(categoryType)} Memories (${memories.length} total)`
      )
      .setDescription(
        `Showing ${categoryType} memories.\n\n` +
          '💡 **Note:** Memories cannot be manually edited. If you want to update or remove a memory, simply ask me in chat to forget something or remember something new!'
      )
      .setFooter({
        text: `⭐ = importance • Page ${currentPage}/${totalPages}${memories.length > MAX_CATEGORY_PAGES * MEMORIES_PER_CATEGORY_PAGE ? ' • Use DM Me for full list' : ''}`,
      })

    // Add memory fields
    for (const memory of memoriesToShow) {
      const stars = '⭐'.repeat(Math.min(memory.importance, 3))
      const age = getRelativeTime(memory.createdAt)
      const location = memory.guildId ? 'Server' : 'DM'

      embed.addFields({
        name: `${stars} ${memory.key}`,
        value: `${memory.value}\n_${location} • ${age}_`,
        inline: false,
      })
    }

    // Build custom_id helper
    const buildCustomId = (action: string, page: number) => {
      return `minaai:btn:${action}|type:${categoryType}|mem_type:${memType}|page:${page}`
    }

    // Create navigation buttons
    const navRow = new ActionRowBuilder<ButtonBuilder>()
    if (currentPage > 1) {
      navRow.addComponents(
        new ButtonBuilder()
          .setCustomId(buildCustomId('category_page', currentPage - 1))
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⬅️')
      )
    }
    if (currentPage < totalPages) {
      navRow.addComponents(
        new ButtonBuilder()
          .setCustomId(buildCustomId('category_page', currentPage + 1))
          .setLabel('Next')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('➡️')
      )
    }

    // Back button
    const backButton = createSecondaryBtn({
      customId: `minaai:btn:back_memories|type:${memType}|page:1`,
      label: 'Back to Main View',
      emoji: '◀️',
    })

    // Combine components
    const components: ActionRowBuilder<ButtonBuilder>[] = []
    if (navRow.components.length > 0) {
      components.push(navRow)
    }

    // Add DM Me button if memories exceed 2 pages (10 memories)
    if (memories.length > MAX_CATEGORY_PAGES * MEMORIES_PER_CATEGORY_PAGE) {
      const dmMeButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(buildCustomId('dm_me_category', currentPage))
          .setLabel('DM Me')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📬')
      )
      components.push(dmMeButton)
    }

    components.push(backButton)

    await interaction.editReply({
      embeds: [embed],
      components,
    })

    logger.log(
      `User ${userId} viewed category ${categoryType} (page ${currentPage}/${totalPages}) in guild ${guildId}`
    )
  } catch (error) {
    logger.error(
      `Error showing category detail: ${(error as Error).message}`,
      error as Error
    )

    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Error')
      .setDescription(
        'Failed to load category details. Please try again later.'
      )

    const backButton = createSecondaryBtn({
      customId: 'minaai:btn:back',
      label: 'Back to Main Menu',
      emoji: '◀️',
    })

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [backButton],
    })
  }
}

/**
 * Handle DM Me button - sends embed + pastebin link
 */
export async function handleDmMe(
  interaction: ButtonInteraction
): Promise<void> {
  try {
    await interaction.deferUpdate()

    const userId = interaction.user.id
    const guildId = interaction.guildId || null
    const user = interaction.user as User

    // Parse state
    const { state } = parseCustomIdState(interaction.customId)
    const isCategoryView = interaction.customId.includes('dm_me_category')
    const memType = state.mem_type || state.type || 'server'
    const categoryType = isCategoryView ? state.type : null

    // Build query
    const query: any = { userId }
    if (isCategoryView && categoryType) {
      // Category detail view
      query.memoryType = categoryType
      if (memType === 'dm') {
        query.guildId = null
      } else {
        query.guildId = guildId
      }
    } else {
      // Main view
      if (memType === 'dm') {
        query.guildId = null
      } else {
        query.guildId = guildId
      }
    }

    // Fetch all memories
    const memories = await AiMemoryModel.find(query)
      .sort({ importance: -1, lastAccessed: -1 })
      .limit(500)

    if (memories.length === 0) {
      await interaction.followUp({
        content: 'No memories to send.',
        ephemeral: true,
      })
      return
    }

    // Format memories for pastebin
    let content = `Memories for ${user.tag} (${user.id})\n`
    content += `Type: ${isCategoryView && categoryType ? capitalizeFirst(categoryType) : memType === 'dm' ? 'DM' : 'Server'} Memories\n`
    content += `Total: ${memories.length}\n`
    content += `Generated: ${new Date().toISOString()}\n\n`
    content += '='.repeat(50) + '\n\n'

    // Group by type if main view
    if (!isCategoryView || !categoryType) {
      const byType: Record<string, typeof memories> = {}
      for (const memory of memories) {
        if (!byType[memory.memoryType]) {
          byType[memory.memoryType] = []
        }
        byType[memory.memoryType].push(memory)
      }

      for (const [type, mems] of Object.entries(byType)) {
        content += `\n## ${capitalizeFirst(type)} (${mems.length})\n\n`
        for (const mem of mems) {
          content += `[${mem.importance}/10] ${mem.key}: ${mem.value}\n`
          content += `  Location: ${mem.guildId ? 'Server' : 'DM'}\n`
          content += `  Created: ${mem.createdAt.toISOString()}\n`
          content += `  Last Accessed: ${mem.lastAccessedAt.toISOString()}\n`
          content += `  Access Count: ${mem.accessCount}\n\n`
        }
      }
    } else {
      // Category view - single type
      for (const mem of memories) {
        content += `[${mem.importance}/10] ${mem.key}: ${mem.value}\n`
        content += `  Location: ${mem.guildId ? 'Server' : 'DM'}\n`
        content += `  Created: ${mem.createdAt.toISOString()}\n`
        content += `  Last Accessed: ${mem.lastAccessedAt.toISOString()}\n`
        content += `  Access Count: ${mem.accessCount}\n\n`
      }
    }

    // Post to pastebin
    const title =
      isCategoryView && categoryType
        ? `${capitalizeFirst(categoryType)} Memories for ${user.tag}`
        : `${memType === 'dm' ? 'DM' : 'Server'} Memories for ${user.tag}`

    const binUrl = await postToBin(content, title)

    if (!binUrl) {
      await interaction.followUp({
        content: 'Failed to generate pastebin link. Please try again later.',
        ephemeral: true,
      })
      return
    }

    // Create embed for DM
    const dmEmbed = new EmbedBuilder()
      .setColor('#00aaff')
      .setTitle(
        `🧠 Your ${isCategoryView && categoryType ? capitalizeFirst(categoryType) : memType === 'dm' ? 'DM' : 'Server'} Memories`
      )
      .setDescription(
        `Here are your memories!\n\n` +
          `**Total:** ${memories.length} memories\n\n` +
          `Click the button below to view all memories.`
      )
      .setFooter({ text: 'Privacy first! 💕' })
      .setTimestamp()

    const viewButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('View All Memories')
        .setURL(binUrl.short)
        .setStyle(ButtonStyle.Link)
    )

    // Try to DM user
    try {
      await user.send({
        embeds: [dmEmbed],
        components: [viewButton],
      })

      await interaction.followUp({
        content: "✅ I've sent your memories to your DMs!",
        ephemeral: true,
      })
    } catch (dmError) {
      // User has DMs disabled
      await interaction.followUp({
        content: `I couldn't send you a DM, but here's your memories link: ${binUrl.short}`,
        ephemeral: true,
      })
    }

    logger.log(
      `User ${userId} requested DM with ${memories.length} memories (type: ${memType}, category: ${isCategoryView && categoryType ? categoryType : 'all'})`
    )
  } catch (error) {
    logger.error(
      `Error handling DM Me: ${(error as Error).message}`,
      error as Error
    )

    await interaction.followUp({
      content: 'Failed to generate memories link. Please try again later.',
      ephemeral: true,
    })
  }
}

/**
 * Handle category pagination button
 */
export async function handleCategoryPage(
  interaction: ButtonInteraction
): Promise<void> {
  await showCategoryDetailView(interaction)
}

/**
 * Handle back to main memories view
 */
export async function handleBackToMemories(
  interaction: ButtonInteraction
): Promise<void> {
  // Parse state to preserve memory type
  const { state } = parseCustomIdState(interaction.customId)
  const memType = (state.type as 'server' | 'dm') || 'server'

  await interaction.deferUpdate()
  await showMemoriesView(interaction, memType)
}

// Helper functions
function getTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    preference: '❤️',
    fact: '📝',
    opinion: '💭',
    experience: '🎯',
    relationship: '🤝',
    user: '👤',
    topic: '💬',
  }
  return emojis[type] || '📌'
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function getRelativeTime(date: Date): string {
  const now = Date.now()
  const diff = now - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (months > 0) return `${months}mo ago`
  if (weeks > 0) return `${weeks}w ago`
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}
