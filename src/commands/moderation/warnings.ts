import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  GuildMember,
} from 'discord.js'
import { getWarningLogs, clearWarningLogs } from '@schemas/ModLog'
import { getMember } from '@schemas/Member'
import { MODERATION } from '@src/config'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'warnings',
  description: "view a member's warning history or clear their warnings",
  category: 'MODERATION',
  userPermissions: ['KickMembers'],

  slashCommand: {
    enabled: MODERATION.ENABLED,
    options: [
      {
        name: 'list',
        description: 'list all warnings for a user',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the target member',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
      {
        name: 'clear',
        description: 'clear all warnings for a user',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user',
            description: 'the target member',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    let response: any = ''

    if (!interaction.guild) {
      await interaction.followUp({
        embeds: [MinaEmbed.error(mina.say('serverOnly'))],
      })
      return
    }

    if (sub === 'list') {
      const user = interaction.options.getUser('user')
      if (!user) {
        await interaction.followUp({
          embeds: [MinaEmbed.error(mina.say('notFound.user'))],
        })
        return
      }
      const target =
        (await interaction.guild.members.fetch(user.id)) ||
        (interaction.member as GuildMember)
      response = await listWarnings(target, interaction)
    } else if (sub === 'clear') {
      const user = interaction.options.getUser('user')
      if (!user) {
        await interaction.followUp({
          embeds: [MinaEmbed.error(mina.say('notFound.user'))],
        })
        return
      }
      const target = await interaction.guild.members.fetch(user.id)
      response = await clearWarnings(target, interaction)
    } else {
      response = {
        embeds: [MinaEmbed.error(mina.say('error.generic'))],
      }
    }

    await interaction.followUp(response)
    return
  },
}

async function listWarnings(
  target: GuildMember,
  interaction: ChatInputCommandInteraction
): Promise<string | { embeds: MinaEmbed[] }> {
  if (!target) {
    return {
      embeds: [MinaEmbed.error(mina.say('notFound.user'))],
    }
  }
  if (target.user.bot) {
    return {
      embeds: [MinaEmbed.error(mina.say('moderation.warnings.noBots'))],
    }
  }

  const warnings = await getWarningLogs(
    interaction.guildId as string,
    target.id
  )
  if (!warnings.length) {
    return {
      embeds: [
        MinaEmbed.info(
          mina.sayf('moderation.warnings.none', {
            target: target.user.username,
          })
        ),
      ],
    }
  }

  const acc = warnings
    .map(
      (warning, i) =>
        `${i + 1}. ${warning.reason} [${mina.say('generic.requestedByLabel')} ${warning.admin.username}]`
    )
    .join('\n')
  const embed = MinaEmbed.info()
    .setAuthor({
      name: mina.sayf('moderation.warnings.title', {
        target: target.user.username,
      }),
    })
    .setDescription(acc)

  return { embeds: [embed] }
}

async function clearWarnings(
  target: GuildMember,
  interaction: ChatInputCommandInteraction
): Promise<string | { embeds: MinaEmbed[] }> {
  if (!target) {
    return {
      embeds: [MinaEmbed.error(mina.say('notFound.user'))],
    }
  }
  if (target.user.bot) {
    return {
      embeds: [MinaEmbed.error(mina.say('moderation.warnings.noBots'))],
    }
  }

  const memberDb = await getMember(interaction.guildId as string, target.id)
  ;(memberDb as any).warnings = 0
  await (memberDb as any).save()

  await clearWarningLogs(interaction.guildId as string, target.id)
  return {
    embeds: [
      MinaEmbed.success(
        mina.sayf('moderation.warnings.cleared', {
          target: target.user.username,
        })
      ),
    ],
  }
}

export default command
