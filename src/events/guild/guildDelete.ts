import { Guild } from 'discord.js'
import { getSettings, Model } from '@schemas/Guild'
import { notifyDashboard } from '@helpers/webhook'
import { config } from '@src/config'
import type { BotClient } from '@src/structures'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

const wait = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

/**
 * Handles guild deletion event when the bot leaves a server
 * @param {BotClient} client - The bot client instance
 * @param {Guild} guild - The guild that was left
 */
export default async (client: BotClient, guild: Guild): Promise<void> => {
  if (!guild.available) return
  client.logger.log(
    `Guild Left: ${guild.name} (${guild.id}) Members: ${guild.memberCount}`
  )

  const settings = await getSettings(guild)

  // Update database directly
  try {
    await Model.findByIdAndUpdate(guild.id, {
      'server.leftAt': new Date(),
    })
  } catch (err: any) {
    client.logger.error(`Failed to update leftAt in DB: ${err.message}`)
  }

  // Notify dashboard to refresh guild data (fire-and-forget)
  notifyDashboard(client, guild.id, 'leave')

  let ownerTag = 'Deleted User'
  const ownerId = guild.ownerId || settings.server.owner
  let owner

  try {
    owner = await client.users.fetch(ownerId)
    ownerTag = owner.tag
    client.logger.log(`Fetched owner: ${ownerTag}`)
  } catch (err: any) {
    client.logger.error(`Failed to fetch owner: ${err.message}`)
  }

  // Create the embed for webhook
  const webhookEmbed = MinaEmbed.error()
    .setTitle(mina.sayf('greetings.leave', { server: guild.name }))
    .setThumbnail(guild.iconURL())
    .addFields(
      {
        name: 'server name',
        value: guild.name || 'n/a',
        inline: true,
      },
      {
        name: 'server id',
        value: guild.id,
        inline: true,
      },
      {
        name: 'owner',
        value: `${ownerTag} [\`${ownerId}\`]`,
        inline: true,
      },
      {
        name: 'members',
        value: `\`\`\`yaml\n${guild.memberCount}\`\`\``,
        inline: true,
      }
    )
    .setFooter({
      text: `server #${client.guilds.cache.size}`,
    })

  // Send webhook message
  if (client.joinLeaveWebhook) {
    try {
      await client.joinLeaveWebhook.send({
        username: 'Amina (Left)',
        avatarURL: client.user?.displayAvatarURL(),
        embeds: [webhookEmbed],
      })
    } catch (err: any) {
      client.logger.error(`Failed to send webhook message: ${err.message}`)
    }
  } else {
    client.logger.warn('Join/Leave webhook is not configured.')
  }

  // Attempt to send DM to owner
  if (owner) {
    const row = MinaRows.from(
      MinaButtons.invite(client.getInvite()).setLabel(
        mina.say('greetings.leaveDM.buttons.invite')
      ),
      MinaButtons.support(config.BOT.SUPPORT_SERVER as string),
      MinaButtons.link(
        'https://github.com/iamvikshan/amina/issues/new/choose',
        mina.say('greetings.leaveDM.buttons.feedback')
      )
    )

    // Create a new embed for the DM
    const dmEmbed = MinaEmbed.error()
      .setTitle(mina.sayf('greetings.leaveDM.title', { user: owner.username }))
      .setDescription(
        mina.sayf('greetings.leaveDM.description', { server: guild.name })
      )
      .setThumbnail(client.user?.displayAvatarURL() || '')
      .setFooter({ text: mina.say('greetings.leaveDM.footer') })

    try {
      await wait(1000)
      await owner.send({
        embeds: [dmEmbed],
        components: [row],
      })
    } catch (err: any) {
      client.logger.error(`Error sending DM: ${err.message}`)
      if (err.code === 50007) {
        client.logger.warn(
          'Cannot send messages to this user. They may have DMs disabled or blocked the bot.'
        )
      }
    }
  }
}
