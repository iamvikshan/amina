import { StringSelectMenuInteraction, ButtonInteraction } from 'discord.js'
import { memoryService } from '@src/services/memoryService'
import { getUser } from '@schemas/User'
import Logger from '@helpers/Logger'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'
import { showMinaAiHub } from './main-hub'

const logger = Logger

/**
 * Show forget-me confirmation screen
 */
export async function showForgetMeConfirmation(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = MinaEmbed.warning()
    .setTitle(mina.say('minaai.forget.confirm.title'))
    .setDescription(mina.say('minaai.forget.confirm.description'))
    .setFooter({ text: mina.say('minaai.forget.confirm.footer') })

  const confirmButton = MinaRows.from(
    MinaButtons.delete('minaai:btn:forget_confirm').setLabel(
      mina.say('minaai.forget.confirm.button')
    )
  )

  const cancelButton = MinaRows.from(
    MinaButtons.stop('minaai:btn:forget_cancel').setLabel(
      mina.say('minaai.forget.confirm.cancel')
    )
  )

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

    const embed =
      deleted > 0
        ? MinaEmbed.success()
        : MinaEmbed.warning()
            .setTitle(mina.say('minaai.forget.success.title'))
            .setDescription(
              deleted > 0
                ? mina.sayf('minaai.forget.success.deleted', {
                    count: deleted.toString(),
                    plural: deleted === 1 ? 'memory' : 'memories',
                  })
                : mina.say('minaai.forget.success.none')
            )
            .setFooter({ text: mina.say('minaai.forget.success.footer') })
            .setTimestamp()

    const backButton = MinaRows.backRow('minaai:btn:back')

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

    const errorEmbed = MinaEmbed.error()
      .setTitle(mina.say('minaai.forget.error.title'))
      .setDescription(mina.say('minaai.forget.error.description'))

    const backButton = MinaRows.backRow('minaai:btn:back')

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
