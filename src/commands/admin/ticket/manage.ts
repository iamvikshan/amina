import { TextChannel, User, Guild } from 'discord.js'
import ticketHandler from '@src/handlers/ticket'

const { isTicketChannel, closeTicket, closeAllTickets } = ticketHandler

export async function close(
  interaction: { channel: TextChannel },
  author: User
): Promise<string | null> {
  const { channel } = interaction

  if (!isTicketChannel(channel))
    return 'This command can only be used in ticket channels'

  const status = await closeTicket(channel, author, 'Closed by a moderator')

  if (status === 'MISSING_PERMISSIONS')
    return 'I do not have permission to close tickets'
  if (status === 'ERROR') return 'An error occurred while closing the ticket'

  return null
}

export async function closeAll(
  interaction: { guild: Guild },
  user: User
): Promise<string> {
  const { guild } = interaction
  const stats = await closeAllTickets(guild, user)
  return `Completed! Success: \`${stats[0]}\` Failed: \`${stats[1]}\``
}

export async function addToTicket(
  interaction: { channel: TextChannel },
  inputId: string
): Promise<string> {
  const { channel } = interaction

  if (!isTicketChannel(channel))
    return 'This command can only be used in ticket channel'
  if (!inputId || isNaN(Number(inputId)))
    return 'Oops! You need to input a valid userId/roleId'

  try {
    await channel.permissionOverwrites.create(inputId, {
      ViewChannel: true,
      SendMessages: true,
    })

    return 'Done'
  } catch (_ex) {
    return 'Failed to add user/role. Did you provide a valid ID?'
  }
}

export async function removeFromTicket(
  interaction: { channel: TextChannel },
  inputId: string
): Promise<string> {
  const { channel } = interaction

  if (!isTicketChannel(channel))
    return 'This command can only be used in ticket channel'
  if (!inputId || isNaN(Number(inputId)))
    return 'Oops! You need to input a valid userId/roleId'

  try {
    await channel.permissionOverwrites.create(inputId, {
      ViewChannel: false,
      SendMessages: false,
    })
    return 'Done'
  } catch (_ex) {
    return 'Failed to remove user/role. Did you provide a valid ID?'
  }
}

export default 0
