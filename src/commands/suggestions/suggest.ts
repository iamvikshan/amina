import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
  TextChannel,
  ButtonStyle,
} from 'discord.js'
import { SUGGESTIONS } from '@src/config'
import { addSuggestion } from '@schemas/Suggestions'
import { stripIndent } from 'common-tags'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'suggest',
  description: 'submit a suggestion',
  category: 'SUGGESTION',
  cooldown: 20,
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
      return interaction.followUp(mina.say('serverOnly'))
    }

    const member = interaction.member as GuildMember
    if (!member) {
      return interaction.followUp(mina.say('notFound.user'))
    }

    const suggestion = interaction.options.getString('suggestion', true)
    const settings = data?.settings || {}
    const response = await suggest(member, suggestion, settings)
    if (typeof response === 'boolean')
      return interaction.followUp(mina.say('suggestions.submit'))
    else return interaction.followUp(response)
  },
}

async function suggest(
  member: GuildMember,
  suggestion: string,
  settings: any
): Promise<boolean | string> {
  if (!settings.suggestions?.enabled)
    return mina.say('suggestions.error.disabled')
  if (!settings.suggestions.channel_id)
    return mina.say('suggestions.error.channelNotSet')

  const channel = member.guild.channels.cache.get(
    settings.suggestions.channel_id
  ) as TextChannel | undefined

  if (!channel) return mina.say('suggestions.error.channelNotFound')

  const embed = MinaEmbed.primary()
    .setAuthor({ name: mina.say('suggestions.submit') })
    .setThumbnail(member.user.displayAvatarURL())
    .setDescription(
      stripIndent`
        ${suggestion}

        **submitter** 
        ${member.user.username} [${member.id}]
      `
    )
    .setTimestamp()

  const buttonsRow = MinaRows.from(
    MinaButtons.yeah('SUGGEST_APPROVE').setLabel(
      mina.say('suggestions.buttons.approve')
    ),
    MinaButtons.stop('SUGGEST_REJECT').setLabel(
      mina.say('suggestions.buttons.reject')
    ),
    MinaButtons.custom(
      'SUGGEST_DELETE',
      mina.say('suggestions.buttons.delete'),
      ButtonStyle.Secondary
    )
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
    return mina.say('suggestions.error.sendFailed')
  }
}

export default command
