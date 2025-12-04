import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
import { getMember } from '@schemas/Member'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import inviteHandler from '@handlers/invite'

const { getEffectiveInvites, checkInviteRewards } = inviteHandler

/**
 * Handle adding invites to a user (admin)
 * Requires ManageGuild permission
 */
export async function handleAddInvites(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  // Guild check
  if (!interaction.guild) {
    await interaction.reply({
      content: 'this command can only be used in a server.',
      ephemeral: true,
    })
    return
  }

  // User permission check
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'you need `Manage Server` permission to use this command.',
      ephemeral: true,
    })
    return
  }

  const user = interaction.options.getUser('user', true)
  const amount = interaction.options.getInteger('invites', true)

  if (user.bot) {
    await interaction.reply({
      content: "you can't add invites to bots.",
      ephemeral: true,
    })
    return
  }

  await interaction.deferReply()

  try {
    const memberDb = (await getMember(interaction.guild.id, user.id)) as any
    if (!memberDb.invite_data) {
      memberDb.invite_data = {
        tracked: 0,
        added: 0,
        fake: 0,
        left: 0,
      }
    }
    memberDb.invite_data.added += amount
    await memberDb.save()

    const embed = MinaEmbed.primary()
      .setAuthor({ name: `added invites to ${user.username}` })
      .setThumbnail(user.displayAvatarURL())
      .setDescription(
        `${user.username} now has ${getEffectiveInvites(memberDb.invite_data)} invites`
      )

    checkInviteRewards(interaction.guild, memberDb, true)
    await interaction.editReply({ embeds: [embed] })
  } catch (err: any) {
    await interaction.editReply(`failed to add invites: ${err.message}`)
  }
}

export default 0
