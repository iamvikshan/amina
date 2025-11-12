import { unBanTarget } from '@helpers/ModUtils'
import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ApplicationCommandOptionType,
  ComponentType,
  ChatInputCommandInteraction,
  GuildMember,
  Guild,
  Message,
  User,
} from 'discord.js'
import { MODERATION } from '@src/config'
import type { Command } from '@structures/Command'

const command: Command = {
  name: 'unban',
  description: 'unbans the specified member',
  category: 'MODERATION',
  botPermissions: ['BanMembers'],
  userPermissions: ['BanMembers'],

  slashCommand: {
    enabled: MODERATION.ENABLED,
    ephemeral: true,
    options: [
      {
        name: 'name',
        description: 'match the name of the member',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'reason',
        description: 'reason for ban',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const match = interaction.options.getString('name', true)
    const reason = interaction.options.getString('reason')

    if (!interaction.guild) {
      await interaction.followUp('This command can only be used in a server.')
      return
    }

    const response = await getMatchingBans(interaction.guild, match)
    const sent = await interaction.followUp(response as any)
    if (typeof response !== 'string')
      await waitForBan(interaction.member as GuildMember, reason, sent)
  },
}

async function getMatchingBans(guild: Guild, match: string) {
  const bans = await guild.bans.fetch({ cache: false })

  const matched: User[] = []
  for (const [, ban] of bans) {
    if (ban.user.partial) await ban.user.fetch()

    // exact match
    if (ban.user.id === match || ban.user.tag === match) {
      matched.push(ban.user)
      break
    }

    // partial match
    if (ban.user.username.toLowerCase().includes(match.toLowerCase())) {
      matched.push(ban.user)
    }
  }

  if (matched.length === 0) return `No user found matching ${match}`

  const options = []
  for (const user of matched) {
    options.push({ label: user.tag, value: user.id })
  }

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('unban-menu')
      .setPlaceholder('Choose a user to unban')
      .addOptions(options)
  )

  return {
    content: 'Please select a user you wish to unban',
    components: [menuRow],
  }
}

async function waitForBan(
  issuer: GuildMember,
  reason: string | null,
  sent: Message
) {
  const collector = sent.channel?.createMessageComponentCollector({
    filter: m =>
      m.member?.id === issuer.id &&
      m.customId === 'unban-menu' &&
      sent.id === m.message.id,
    time: 20000,
    max: 1,
    componentType: ComponentType.StringSelect,
  })

  if (!collector) return

  collector.on('collect', async response => {
    const userId = response.values[0]
    const user = await issuer.client.users.fetch(userId, { cache: true })

    const status = await unBanTarget(issuer, user, reason)
    if (typeof status === 'boolean')
      return sent.edit({
        content: `${user.username} is un-banned!`,
        components: [],
      })
    else
      return sent.edit({
        content: `Failed to unban ${user.username}`,
        components: [],
      })
  })

  // collect user and unban
  collector.on('end', async collected => {
    if (collected.size === 0)
      return sent.edit('Oops! Timed out. Try again later.')
  })
}

export default command
