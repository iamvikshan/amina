import { ChannelType, CategoryChannel, Guild } from 'discord.js'
import { getSettings, updateSettings } from '@src/database/schemas/Guild'

export async function setupTicketCategory(
  guild: Guild,
  category: CategoryChannel
): Promise<string> {
  if (category.type !== ChannelType.GuildCategory) {
    return "that's not a category channel. try again with a proper category?"
  }

  const settings = await getSettings(guild)
  settings.ticket.category = category.id
  settings.ticket.enabled = true
  await updateSettings(guild.id, settings)

  return `i've set the ticket category to ${category.name}. all new tickets will appear there now!`
}

export async function removeTicketCategory(guild: Guild): Promise<string> {
  const settings = await getSettings(guild)
  if (!settings.ticket.category) {
    return "there's no ticket category set right now. nothing to remove!"
  }

  settings.ticket.category = ''
  settings.ticket.enabled = false
  await updateSettings(guild.id, settings)

  let response =
    "i've removed the ticket category and disabled the ticket system.\n\n"
  response += 'to set up a new category, please use `/ticket category add`.\n'
  response +=
    "if you don't, i'll create a new 'Tickets' category when someone opens a ticket."

  return response
}

export default 0
