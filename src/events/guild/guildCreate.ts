import { getSettings as registerGuild, setInviteLink } from '@schemas/Guild'
import {
  PermissionFlagsBits,
  ChannelType,
  Guild,
  TextChannel,
} from 'discord.js'
import { config } from '@src/config'
import { notifyDashboard } from '@helpers/webhook'
import type { BotClient } from '@src/structures'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

/**
 * Handles guild creation event when the bot joins a new server
 * @param {BotClient} client - The bot client instance
 * @param {Guild} guild - The guild that was joined
 */
export default async (client: BotClient, guild: Guild): Promise<void> => {
  if (!guild.available) return
  if (!guild.members.cache.has(guild.ownerId)) {
    await guild.fetchOwner({ cache: true }).catch(() => {})
  }
  client.logger.log(`Guild Joined: ${guild.name} Members: ${guild.memberCount}`)
  const guildSettings = await registerGuild(guild)

  // Note: When GLOBAL=true, global commands automatically apply to all guilds
  // We don't register per-guild to avoid duplicates (global commands may take up to 1 hour to propagate)

  // Ensure owner is set
  if (!guildSettings.server.owner) {
    guildSettings.server.owner = guild.ownerId
    await guildSettings.save()
  }

  // Notify dashboard to refresh guild data (fire-and-forget)
  notifyDashboard(client, guild.id, 'join')

  // Check for existing invite link or create a new one
  let inviteLink = guildSettings.server.invite_link
  if (!inviteLink) {
    try {
      const botMember = guild.members.me
      if (!botMember) {
        client.logger.warn(
          `Bot member not found in guild ${guild.id}, cannot create invite`
        )
        inviteLink = 'Unable to create invite link'
      } else {
        const targetChannel = guild.channels.cache.find(
          (channel): channel is TextChannel =>
            channel.type === ChannelType.GuildText &&
            channel
              .permissionsFor(botMember)
              .has(PermissionFlagsBits.CreateInstantInvite)
        )

        if (targetChannel) {
          const invite = await targetChannel.createInvite({
            maxAge: 0,
            maxUses: 0,
          })
          inviteLink = invite.url
          await setInviteLink(guild.id, inviteLink)
        } else {
          inviteLink = 'Unable to create invite link'
        }
      }
    } catch (error) {
      client.logger.error('Error creating invite:', error)
      inviteLink = 'Unable to create invite link'
    }
  }

  // Create the buttons
  const row = MinaRows.from(
    MinaButtons.support(config.BOT.SUPPORT_SERVER as string)
  )

  // Only proceed if setup is not completed
  if (!guildSettings.server.setup_completed) {
    // Send thank you message to the server
    const botMember = guild.members.me
    const targetChannel = botMember
      ? guild.channels.cache.find(
          (channel): channel is TextChannel =>
            channel.type === ChannelType.GuildText &&
            channel
              .permissionsFor(botMember)
              .has(PermissionFlagsBits.SendMessages)
        )
      : null

    let serverMessageLink: string | null = null
    if (targetChannel) {
      const serverEmbed = MinaEmbed.success()
        .setTitle(mina.say('greetings.joinServer.title'))
        .setDescription(
          mina.sayf('greetings.joinServer.description', {
            server: guild.name,
          }) +
            `\n\n[${mina.say('botInfo.support')}](${config.BOT.SUPPORT_SERVER})`
        )
        .setFooter({
          text: mina.say('greetings.joinServer.footer'),
        })

      const sentMessage = await targetChannel.send({
        embeds: [serverEmbed],
        components: [row],
      })
      serverMessageLink = sentMessage.url

      if (!guildSettings.server.updates_channel) {
        guildSettings.server.updates_channel = targetChannel.id
        await guildSettings.save()
      }
    }

    // Send DM to server owner
    try {
      const owner = await guild.members.fetch(guild.ownerId)
      if (owner) {
        const dmEmbed = MinaEmbed.success()
          .setTitle(
            mina.sayf('greetings.joinDM.title', { user: owner.user.username })
          )
          .setDescription(
            mina.sayf('greetings.joinDM.description', { server: guild.name }) +
              `\n\n[${mina.say('botInfo.support')}](${config.BOT.SUPPORT_SERVER})`
          )
          .setFooter({ text: mina.say('greetings.joinDM.footer') })

        if (serverMessageLink) {
          dmEmbed.addFields({
            name: 'server message',
            value: `already sent a message in the server. [click here](${serverMessageLink}) to see it.`,
          })
        }

        await owner.send({
          embeds: [dmEmbed],
          components: [row],
        })
      }
    } catch (_err) {
      client.logger.error('Error sending DM to server owner:', _err)
    }

    // Schedule a reminder - Removed in-memory timeout to prevent leaks
    // We will now handle this via a scheduled task checking db timestamps
  }

  // Log join to webhook if available
  if (client.joinLeaveWebhook) {
    try {
      const embed = MinaEmbed.success()
        .setTitle(`joined ${guild.name}!`)
        .setThumbnail(guild.iconURL())
        .addFields(
          { name: 'server name', value: guild.name, inline: false },
          { name: 'server id', value: guild.id, inline: false },
          {
            name: 'owner',
            value: `${client.users.cache.get(guild.ownerId)?.tag} [\`${guild.ownerId}\`]`,
            inline: false,
          },
          {
            name: 'members',
            value: `\`\`\`yaml\n${guild.memberCount}\`\`\``,
            inline: false,
          },
          {
            name: 'invite link',
            value: inviteLink,
            inline: false,
          }
        )
        .setFooter({ text: `guild #${client.guilds.cache.size}` })

      await client.joinLeaveWebhook.send({
        username: 'Join',
        avatarURL: client.user?.displayAvatarURL(),
        embeds: [embed],
      })
      client.logger.success(
        'Successfully sent webhook message for guild join event.'
      )
    } catch (err: any) {
      client.logger.error(`Failed to send join webhook message: ${err.message}`)
    }
  }
}
