import {
  GuildMember,
  GuildTextBasedChannel,
  User,
  ChannelType,
} from 'discord.js'

export default async function start(
  member: GuildMember,
  giveawayChannel: GuildTextBasedChannel,
  duration: number,
  prize: string,
  winners: number,
  host?: User | null,
  allowedRoles: string[] = []
): Promise<string> {
  try {
    if (!host) host = member.user

    // Check if the bot has "Add Reactions" permission
    const botMember = member.guild.members.me
    if (
      !botMember ||
      !giveawayChannel.permissionsFor(botMember).has('AddReactions')
    ) {
      return `I do not have permission to add reactions in ${giveawayChannel}.`
    }

    if (!member.permissions.has('ManageMessages')) {
      return 'You need to have the manage messages permissions to start giveaways.'
    }

    if (
      !(
        giveawayChannel.type === ChannelType.GuildText ||
        giveawayChannel.type === ChannelType.GuildAnnouncement
      )
    ) {
      return 'You can only start giveaways in text or announcement channels.'
    }

    // Mention the allowed roles
    const mentionedRoles = allowedRoles.map(roleId => `<@&${roleId}>`).join(' ')

    // Send the message with the mentioned roles or a default message
    const messageContent =
      mentionedRoles.length > 0
        ? `${mentionedRoles}`
        : 'A new giveaway is starting! Everyone can participate!'

    await giveawayChannel.send(messageContent)

    /**
     * @type {import("discord-giveaways").GiveawayStartOptions}
     */
    const options: any = {
      duration: duration,
      prize,
      winnerCount: winners,
      hostedBy: host,
      thumbnail: 'https://i.imgur.com/DJuTuxs.png',
      messages: {
        giveaway: '🎉 **GIVEAWAY** 🎉',
        giveawayEnded: '🎉 **GIVEAWAY ENDED** 🎉',
        inviteToParticipate: 'React with 🎁 to enter',
        dropMessage: 'Be the first to react with 🎁 to win!',
        hostedBy: `\nHosted by: ${host.username}`,
      },
    }

    if (allowedRoles.length > 0) {
      options.exemptMembers = (member: GuildMember) =>
        !member.roles.cache.find(role => allowedRoles.includes(role.id))
    }

    await (member.client as any).giveawaysManager.start(
      giveawayChannel,
      options
    )

    return `Giveaway started in ${giveawayChannel}`
  } catch (error: any) {
    ;(member.client as any).logger.error('Giveaway Start', error)
    return `An error occurred while starting the giveaway: ${error.message}`
  }
}
