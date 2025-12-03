import { GuildMember } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

export default function user(member: GuildMember) {
  let color: `#${string}` = member.displayHexColor as `#${string}`
  if (color === '#000000') color = mina.color.primary as `#${string}`

  let rolesString = member.roles.cache.map(r => r.name).join(', ')
  if (rolesString.length > 1024)
    rolesString = rolesString.substring(0, 1020) + '...'

  const embed = MinaEmbed.info()
    .setAuthor({
      name: mina.sayf('infoCmd.user.title', { user: member.displayName }),
      iconURL: member.user.displayAvatarURL(),
    })
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(color as `#${string}`)
    .addFields(
      {
        name: mina.say('infoCmd.user.fields.username'),
        value: member.user.username,
        inline: true,
      },
      {
        name: mina.say('infoCmd.user.fields.id'),
        value: member.id,
        inline: true,
      },
      {
        name: mina.say('infoCmd.user.fields.guildJoined'),
        value: member.joinedAt?.toUTCString() || 'unknown',
      },
      {
        name: mina.say('infoCmd.user.fields.registered'),
        value: member.user.createdAt.toUTCString(),
      },
      {
        name: mina.sayf('infoCmd.user.fields.roles', {
          count: member.roles.cache.size.toString(),
        }),
        value: rolesString,
      },
      {
        name: mina.say('infoCmd.user.fields.avatarUrl'),
        value: member.user.displayAvatarURL({ extension: 'png' }),
      }
    )
    .setTimestamp(Date.now())

  return { embeds: [embed] }
}
