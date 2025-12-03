import ModUtils from '@helpers/ModUtils'
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { MODERATION } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'nick',
  description: 'nickname commands',
  category: 'MODERATION',
  botPermissions: ['ManageNicknames'],
  userPermissions: ['ManageNicknames'],

  slashCommand: {
    enabled: MODERATION.ENABLED,
    options: [
      {
        name: 'set',
        description: 'change a members nickname',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the member whose nick you want to set',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
          {
            name: 'name',
            description: 'the nickname to set',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
      {
        name: 'reset',
        description: 'reset a members nickname',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the members whose nick you want to reset',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString('name')
    const user = interaction.options.getUser('user')

    if (!user) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('notFound.user'))],
      })
      return
    }

    if (!interaction.guild) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('serverOnly'))],
      })
      return
    }

    const target = await interaction.guild.members.fetch(user)

    const response = await nickname(interaction, target, name)
    await interaction.followUp(response)
    return
  },
}

async function nickname(
  interaction: ChatInputCommandInteraction,
  target: GuildMember,
  name: string | null
): Promise<string | { embeds: MinaEmbed[] }> {
  const { member, guild } = interaction

  if (!ModUtils.canModerate(member as GuildMember, target)) {
    return {
      embeds: [
        MinaEmbed.error(
          mina.sayf('moderation.nick.cannotManage', {
            target: target.user.username,
          })
        ),
      ],
    }
  }
  if (!ModUtils.canModerate(guild?.members.me as GuildMember, target)) {
    return {
      embeds: [
        MinaEmbed.error(
          mina.sayf('moderation.nick.botCannotManage', {
            target: target.user.username,
          })
        ),
      ],
    }
  }

  try {
    await target.setNickname(name)
    return {
      embeds: [
        MinaEmbed.success(
          mina.sayf(
            name ? 'moderation.nick.changed' : 'moderation.nick.reset',
            { target: target.user.username }
          )
        ),
      ],
    }
  } catch (_ex) {
    return {
      embeds: [
        MinaEmbed.error(
          mina.sayf(
            name
              ? 'moderation.nick.failedChange'
              : 'moderation.nick.failedReset',
            { target: target.displayName }
          )
        ),
      ],
    }
  }
}

export default command
