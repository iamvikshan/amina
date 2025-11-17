import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ApplicationCommandOptionType,
  ButtonStyle,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
} from 'discord.js'
import { SUGGESTIONS } from '@src/config'
import { addSuggestion } from '@schemas/Suggestions'
import { stripIndent } from 'common-tags'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'suggest',
  description: 'submit a suggestion',
  category: 'SUGGESTION',
  cooldown: 20,
  testGuildOnly: true,
  slashCommand: {
    enabled: SUGGESTIONS.ENABLED,
    options: [
      {
        name: 'suggestion',
        description: 'the suggestion',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async interactionRun(
    interaction: ChatInputCommandInteraction,
    data: { settings: any }
  ) {
    if (!interaction.guild) {
      return interaction.followUp('This command can only be used in a server.')
    }

    const member = interaction.member as GuildMember
    if (!member) {
      return interaction.followUp('Could not find member information.')
    }

    const suggestion = interaction.options.getString('suggestion', true)
    const settings = data?.settings || {}
    const response = await suggest(member, suggestion, settings)
    if (typeof response === 'boolean')
      await interaction.followUp('Your suggestion has been submitted!')
    else await interaction.followUp(response)
  },
}

async function suggest(
  member: GuildMember,
  suggestion: string,
  settings: any
): Promise<boolean | string> {
  if (!settings.suggestions?.enabled) return 'Suggestion system is disabled.'
  if (!settings.suggestions.channel_id)
    return 'Suggestion channel not configured!'

  const channel = member.guild.channels.cache.get(
    settings.suggestions.channel_id
  ) as TextChannel | undefined

  if (!channel) return 'Suggestion channel not found!'

  const embed = new EmbedBuilder()
    .setAuthor({ name: 'New Suggestion' })
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(SUGGESTIONS.DEFAULT_EMBED as any)
    .setDescription(
      stripIndent`
        ${suggestion}

        **Submitter** 
        ${member.user.username} [${member.id}]
      `
    )
    .setTimestamp()

  let buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('SUGGEST_APPROVE')
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('SUGGEST_REJECT')
      .setLabel('Reject')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('SUGGEST_DELETE')
      .setLabel('Delete')
      .setStyle(ButtonStyle.Secondary)
  )

  try {
    const sentMsg = await channel.send({
      embeds: [embed],
      components: [buttonsRow],
    })

    await sentMsg.react(SUGGESTIONS.EMOJI.UP_VOTE)
    await sentMsg.react(SUGGESTIONS.EMOJI.DOWN_VOTE)

    await addSuggestion(sentMsg, member.id, suggestion)

    return true
  } catch (ex) {
    ;(member.client as any).logger.error('suggest', ex)
    return 'Failed to send message to suggestions channel!'
  }
}

export default command
