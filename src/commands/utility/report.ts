import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
} from 'discord.js'
import { EMBED_COLORS, FEEDBACK } from '@src/config'
import { Logger } from '@helpers/Logger'

const command: CommandData = {
  name: 'report',
  description:
    'Help Mina make the community better! Report issues or share your thoughts~',
  category: 'UTILITY',

  slashCommand: {
    ephemeral: true,
    enabled: FEEDBACK.ENABLED,
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setTitle("Mina's Report System! 🕵️‍♀️")
      .setDescription(
        'Heya! 💖 Wanna help make me even more awesome? Pick what you want to tell the devs about!'
      )

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('report_select')
        .setPlaceholder('Choose something to report or share~')
        .addOptions([
          {
            label: 'Report a Server',
            value: 'server',
            emoji: '🏠',
          },
          { label: 'Report a User', value: 'user', emoji: '👤' },
          { label: 'Report a Bug', value: 'bug', emoji: '🐞' },
          { label: 'Report a TOD Question', value: 'tod', emoji: '🌶️' },
          {
            label: 'Share Your Amazing Feedback',
            value: 'feedback',
            emoji: '💡',
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
      } catch (error) {
        Logger.error('Error handling report select interaction', error)
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
    label: 'Give it a catchy title!',
    style: TextInputStyle.Short,
    placeholder: "What's the scoop? 🍦",
    required: true,
  })

  const descriptionInput = new TextInputBuilder({
    customId: 'description',
    label: 'Spill the tea! ☕',
    style: TextInputStyle.Paragraph,
    placeholder: 'Tell Mina all about it~',
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
      label: `${type === 'server' ? 'Server' : 'User'}'s Secret Code`,
      style: TextInputStyle.Short,
      placeholder: `Enter the ${type} ID here!`,
      required: true,
    })
    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(idInput)
    components.push(thirdActionRow)
  } else if (type === 'tod') {
    const questionIdInput = new TextInputBuilder({
      customId: 'questionId',
      label: 'Which question is it?',
      style: TextInputStyle.Short,
      placeholder: 'Type the question ID here!',
      required: true,
    })
    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(questionIdInput)
    components.push(thirdActionRow)
  } else if (type === 'bug') {
    const reproStepsInput = new TextInputBuilder({
      customId: 'reproSteps',
      label: 'How to reproduce the bug? (Optional)',
      style: TextInputStyle.Paragraph,
      placeholder: 'Share the steps to recreate the bug, if you know them!',
      required: false,
    })
    const thirdActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(reproStepsInput)
    components.push(thirdActionRow)
  } else if (type === 'feedback') {
    const additionalInfoInput = new TextInputBuilder({
      customId: 'additionalInfo',
      label: 'Any extra thoughts? (Optional)',
      style: TextInputStyle.Paragraph,
      placeholder: 'Share any additional ideas or suggestions here!',
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
        ? 'Share Your Thoughts with Mina!'
        : `Tell Mina About This ${type.charAt(0).toUpperCase() + type.slice(1)}!`,
    components,
  })

  await interaction.showModal(modal)
}

export default command
