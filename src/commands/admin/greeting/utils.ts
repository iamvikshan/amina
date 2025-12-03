import { GuildMember, TextChannel } from 'discord.js'
import greetingHandler from '@src/handlers/greeting'

type GreetingType = 'WELCOME' | 'FAREWELL'

const { buildGreeting } = greetingHandler

export async function sendPreview(
  settings: any,
  member: GuildMember,
  greetingType: GreetingType
): Promise<string> {
  const greetingKey = greetingType.toLowerCase()
  const greetingSettings = settings[greetingKey]

  if (!greetingSettings?.enabled)
    return `the ${greetingKey} message is not enabled in this server.`

  const targetChannel = member.guild.channels.cache.get(
    greetingSettings.channel
  ) as TextChannel
  if (!targetChannel)
    return `no channel is configured to send the ${greetingKey} message.`

  const response = await buildGreeting(member, greetingType, greetingSettings)
  if (!response) {
    return `could not build the ${greetingKey} message. please check your settings.`
  }
  await targetChannel.send(response)

  return `sent a preview of the ${greetingKey} message to ${targetChannel.toString()}!`
}

export async function setStatus(
  settings: any,
  status: string,
  greetingType: GreetingType
): Promise<string> {
  const greetingKey = greetingType.toLowerCase()
  const enabled = status.toUpperCase() === 'ON'

  settings[greetingKey].enabled = enabled
  await settings.save()

  return `configuration saved! ${greetingType === 'WELCOME' ? 'welcome' : 'farewell'} message has been ${status === 'ON' ? 'enabled' : 'disabled'}.`
}

export async function setChannel(
  settings: any,
  channel: TextChannel,
  greetingType: GreetingType
): Promise<string> {
  const greetingKey = greetingType.toLowerCase()

  if (
    !channel
      .permissionsFor(channel.guild.members.me as any)
      ?.has(['SendMessages', 'EmbedLinks'])
  ) {
    return `i can't send ${greetingKey}s to that channel. i need the \`Write Messages\` and \`Embed Links\` permissions in ${channel.toString()}!`
  }

  settings[greetingKey].channel = channel.id
  await settings.save()

  return `configuration saved! ${greetingType === 'WELCOME' ? 'welcome' : 'farewell'} messages will now be sent to ${channel.toString()}!`
}

export async function setDescription(
  settings: any,
  desc: string,
  greetingType: GreetingType
): Promise<string> {
  const greetingKey = greetingType.toLowerCase()

  settings[greetingKey].embed.description = desc
  await settings.save()

  return `configuration saved! the ${greetingKey} message description has been updated.`
}

export async function setThumbnail(
  settings: any,
  status: string,
  greetingType: GreetingType
): Promise<string> {
  const greetingKey = greetingType.toLowerCase()

  settings[greetingKey].embed.thumbnail = status.toUpperCase() === 'ON'
  await settings.save()

  return `configuration saved! the thumbnail for the ${greetingKey} message has been updated.`
}

export async function setColor(
  settings: any,
  color: string,
  greetingType: GreetingType
): Promise<string> {
  const greetingKey = greetingType.toLowerCase()

  settings[greetingKey].embed.color = color
  await settings.save()

  return `configuration saved! the color for the ${greetingKey} message has been updated.`
}

export async function setFooter(
  settings: any,
  content: string,
  greetingType: GreetingType
): Promise<string> {
  const greetingKey = greetingType.toLowerCase()

  settings[greetingKey].embed.footer = content
  await settings.save()

  return `configuration saved! the footer for the ${greetingKey} message has been updated.`
}

export async function setImage(
  settings: any,
  url: string,
  greetingType: GreetingType
): Promise<string> {
  const greetingKey = greetingType.toLowerCase()

  settings[greetingKey].embed.image = url
  await settings.save()

  return `configuration saved! the image for the ${greetingKey} message has been updated.`
}

export default 0
