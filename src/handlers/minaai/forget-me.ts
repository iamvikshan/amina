import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
} from 'discord.js'
import { memoryService } from '@src/services/memoryService'
import { getUser } from '@schemas/User'
import Logger from '@helpers/Logger'
import { createDangerBtn, createSecondaryBtn } from '@helpers/componentHelper'
import { showMinaAiHub } from './main-hub'

const logger = Logger

/**
 * Show forget-me confirmation screen
 */
export async function showForgetMeConfirmation(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor('#ffaa00')
    .setTitle('⚠️ Delete All Memories?')
    .setDescription(
      'Are you sure you want to delete **all** memories Mina has about you?\n\n' +
        'This action is **irreversible** and will remove:\n' +
        "• All preferences you've shared\n" +
        '• All facts about you\n' +
        "• All opinions you've expressed\n" +
        "• All experiences you've told me about\n" +
        '• All relationship information\n\n' +
        'Mina will need to learn about you again from scratch.'
    )
    .setFooter({ text: 'Privacy first! This action cannot be undone.' })

  const confirmButton = createDangerBtn({
    customId: 'minaai:btn:forget_confirm',
    label: 'Yes, Delete All Memories',
    emoji: '🗑️',
  })

  const cancelButton = createSecondaryBtn({
    customId: 'minaai:btn:forget_cancel',
    label: 'Cancel',
    emoji: '❌',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [confirmButton, cancelButton],
  })
}

/**
 * Handle forget-me confirmation
 */
export async function handleForgetMeConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  try {
    await interaction.deferUpdate()

    const userId = interaction.user.id
    const guildId = interaction.guildId || null

    // Delete memories
    const deleted = await memoryService.forgetUser(userId, guildId)

    // Also set ignoreMe to true
    const userData = await getUser(interaction.user)
    if (!userData.minaAi) {
      userData.minaAi = {
        ignoreMe: true,
        allowDMs: false,
        combineDmWithServer: false,
        globalServerMemories: false,
      }
    } else {
      userData.minaAi.ignoreMe = true
    }
    await userData.save()

    const embed = new EmbedBuilder()
      .setColor(deleted > 0 ? '#00ff00' : '#ffaa00')
      .setTitle('🧹 Memory Deletion')
      .setDescription(
        deleted > 0
          ? `Successfully deleted **${deleted}** ${
              deleted === 1 ? 'memory' : 'memories'
            } about you.\n\n` +
              `🚫 I will now ignore you. You can change this in \`/mina-ai\` → Settings → Toggle "Ignore Me" off.\n\n` +
              `You start with a clean slate!`
          : 'No memories found to delete. You already have a clean slate!\n\n' +
              `🚫 I will now ignore you. You can change this in \`/mina-ai\` → Settings → Toggle "Ignore Me" off.`
      )
      .setFooter({ text: 'Privacy first! 💕' })
      .setTimestamp()

    const backButton = createSecondaryBtn({
      customId: 'minaai:btn:back',
      label: 'Back to Main Menu',
      emoji: '◀️',
    })

    await interaction.editReply({
      embeds: [embed],
      components: [backButton],
    })

    logger.log(
      `User ${userId} requested memory deletion in guild ${guildId}: ${deleted} deleted`
    )
  } catch (error) {
    logger.error(
      `Error deleting user memories: ${(error as Error).message}`,
      error as Error
    )

    const errorEmbed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Error')
      .setDescription(
        'Failed to delete memories. Please try again later or contact support.'
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
 * Handle forget-me cancellation
 */
export async function handleForgetMeCancel(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showMinaAiHub(interaction)
}
