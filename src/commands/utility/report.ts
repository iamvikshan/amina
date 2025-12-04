import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
} from 'discord.js'
import { FEEDBACK } from '@src/config'
import { Logger } from '@helpers/Logger'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

const command: CommandData = {
  name: 'report',
  description: 'report bugs, suggest features, or report problematic servers',
  category: 'UTILITY',

  slashCommand: {
    ephemeral: true,
    enabled: FEEDBACK.ENABLED,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const embed = MinaEmbed.primary()
      .setTitle("mina's report system")
      .setDescription(
        'heya! wanna help make me even more awesome? pick what you want to tell the devs about!'
      )

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('report_select')
        .setPlaceholder('choose something to report or share')
        .addOptions([
          {
            label: 'report a server',
            value: 'server',
          },
          { label: 'report a user', value: 'user' },
          { label: 'report a bug', value: 'bug' },
          { label: 'report a tod question', value: 'tod' },
          {
            label: 'share your amazing feedback',
            value: 'feedback',
          },
        ])
    )

    await interaction.followUp({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    })

    if (!interaction.channel) {
      return
    }

    const filter = (i: any) => i.user.id === interaction.user.id
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 30000,
    })

    collector.on('collect', async i => {
      try {
        if (i.customId === 'report_select' && i.isStringSelectMenu()) {
          const selected = i.values[0]
          await showReportModal(i, selected)
        }
      } catch (_error) {
        Logger.error('Error handling report select interaction', _error)
      }
    })

    collector.on('end', () => {
      // Collector ended
    })
  },
}

async function showReportModal(
  interaction: StringSelectMenuInteraction,
  type: string
): Promise<void> {
  const titleInput = new TextInputBuilder({
    customId: 'title',
    label: 'give it a catchy title',
    style: TextInputStyle.Short,
    placeholder: "what's the scoop?",
    required: true,
  })

  const descriptionInput = new TextInputBuilder({
    customId: 'description',
    label: 'spill the tea',
    style: TextInputStyle.Paragraph,
    placeholder: 'tell mina all about it',
    required: true,
  })

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    titleInput
  )
  const secondActionRow =
    new ActionRowBuilder<TextInputBuilder>().addComponents(descriptionInput)

  const components: ActionRowBuilder<TextInputBuilder>[] = [
    firstActionRow,
    secondActionRow,
  ]

  if (type === 'server' || type === 'user') {
    const idInput = new TextInputBuilder({
      customId: `${type}Id`,
      label: `${type === 'server' ? 'server' : 'user'}'s secret code`,
      style: TextInputStyle.Short,
      placeholder: `enter the ${type} id here`,
      required: true,
    })
    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(idInput)
    components.push(thirdActionRow)
  } else if (type === 'tod') {
    const questionIdInput = new TextInputBuilder({
      customId: 'questionId',
      label: 'which question is it?',
      style: TextInputStyle.Short,
      placeholder: 'type the question id here',
      required: true,
    })
    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(questionIdInput)
    components.push(thirdActionRow)
  } else if (type === 'bug') {
    const reproStepsInput = new TextInputBuilder({
      customId: 'reproSteps',
      label: 'how to reproduce the bug? (optional)',
      style: TextInputStyle.Paragraph,
      placeholder: 'share the steps to recreate the bug, if you know them',
      required: false,
    })
    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(reproStepsInput)
    components.push(thirdActionRow)
  } else if (type === 'feedback') {
    const additionalInfoInput = new TextInputBuilder({
      customId: 'additionalInfo',
      label: 'any extra thoughts? (optional)',
      style: TextInputStyle.Paragraph,
      placeholder: 'share any additional ideas or suggestions here',
      required: false,
    })
    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        additionalInfoInput
      )
    components.push(thirdActionRow)
  }

  const modal = new ModalBuilder({
    customId: `report_modal_${type}`,
    title:
      type === 'feedback'
        ? 'share your thoughts with mina'
        : `tell mina about this ${type}`,
    components,
  })

  await interaction.showModal(modal)
}

export default command
