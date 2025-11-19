import { getSettings as registerGuild, setInviteLink } from '@schemas/Guild'
import {
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  Guild,
  TextChannel,
  ApplicationCommandType,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { notifyDashboard } from '@helpers/webhook'
import type { BotClient } from '@src/structures'

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

  // Register commands immediately for the new guild (if global commands haven't propagated yet)
  if (client.config.INTERACTIONS.GLOBAL) {
    try {
      const commandsToSet = client.slashCommands
        .filter(cmd => !cmd.testGuildOnly && !cmd.devOnly)
        .map(cmd => ({
          name: cmd.name,
          description: cmd.description,
          type: ApplicationCommandType.ChatInput,
          options: cmd.slashCommand.options,
          dm_permission: cmd.dmCommand ?? false,
        }))

      if (commandsToSet.length > 0) {
        client.logger.log(
          `Registering ${commandsToSet.length} commands for new guild: ${guild.name}`
        )
        await guild.commands.set(commandsToSet)
        client.logger.success(
          `Successfully registered commands for ${guild.name}`
        )
      }
    } catch (error: any) {
      client.logger.error(
        `Failed to register commands for new guild ${guild.name}: ${error.message}`
      )
    }
  }

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
  const components = [
    new ButtonBuilder()
      .setLabel('Support Server')
      .setStyle(ButtonStyle.Link)
      .setURL(process.env.SUPPORT_SERVER as string),
  ]

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(components)

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
      const serverEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.SUCCESS)
        .setTitle('✨ Heya! Amina here to light up your server! ✨')
        .setDescription(
          `*bounces excitedly* OMG, thank you so much for inviting me! I'm Amina, your new bestie and server's creative spark! 💖\n\n` +
            `I'm a ball of energy who loves making servers awesome with my special mix of fun and functionality! Think of me as your server's guardian angel (with a dash of chaos, hehe).\n\n` +
            `🎮 **What I Can Do:**\n` +
            `• Keep your server safe and organized (in my own quirky way!)\n` +
            `• Create fun experiences with games and activities\n` +
            `• Help manage roles and welcome new friends\n` +
            `• And sooo much more!\n\n` +
            `🌟 **Important!** Please run \`/settings\` to unlock all my amazing capabilities! I promise it'll be worth it!\n\n` +
            `*fidgets with excitement* I can't wait to start our adventure together!`
        )
        .addFields({
          name: '🤗 Need Help?',
          value: `Don't be shy! Join our [support server](${process.env.SUPPORT_SERVER}) - I'm always there to help!`,
        })
        .setFooter({
          text: 'Made with 🎶 & ☕',
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
        const dmEmbed = new EmbedBuilder()
          .setColor(EMBED_COLORS.SUCCESS)
          .setTitle('💝 Special Note from Amina!')
          .setDescription(
            `Hiii <@${owner.id}>! *waves enthusiastically*\n\n` +
              `Thank you soooo much for inviting me to ${guild.name}! I'm literally bouncing off the walls with excitement! 🎨✨\n\n` +
              `To get the most out of our adventure together, pretty please run \`/settings\` in your server! It'll help me unlock all my cool features and let me help make your server super amazing!\n\n` +
              `I'm really good at:\n` +
              `🛡️ Keeping things safe and organized\n` +
              `🎮 Making everything more fun and engaging\n` +
              `🎨 Adding my creative touch to everything I do\n` +
              `💫 And lots more surprises!\n\n` +
              `Can't wait to show you everything I can do! Let's make some magic happen!`
          )
          .addFields({
            name: '✨ Need my help?',
            value: `Just join our [support server](${process.env.SUPPORT_SERVER}) - I'm always there to help!`,
          })
          .setFooter({ text: 'Your new creative companion ♥' })

        if (serverMessageLink) {
          dmEmbed.addFields({
            name: '📜 Server Message',
            value: `Oopsie! I might have already sent a message in the server! [Click here](${serverMessageLink}) to see what my excited self said! 🙈`,
          })
        }

        await owner.send({
          embeds: [dmEmbed],
          components: [row],
        })
      }
    } catch (err) {
      client.logger.error('Error sending DM to server owner:', err)
    }

    // Schedule a reminder - Removed in-memory timeout to prevent leaks
    // We will now handle this via a scheduled task checking db timestamps
  }

  // Log join to webhook if available
  if (client.joinLeaveWebhook) {
    try {
      const embed = new EmbedBuilder()
        .setTitle(`✨ Joined ${guild.name}!`)
        .setThumbnail(guild.iconURL())
        .setColor(client.config.EMBED_COLORS.SUCCESS)
        .addFields(
          { name: 'Server Name', value: guild.name, inline: false },
          { name: 'Server ID', value: guild.id, inline: false },
          {
            name: 'Owner',
            value: `${client.users.cache.get(guild.ownerId)?.tag} [\`${guild.ownerId}\`]`,
            inline: false,
          },
          {
            name: 'Members',
            value: `\`\`\`yaml\n${guild.memberCount}\`\`\``,
            inline: false,
          },
          {
            name: 'Invite Link',
            value: inviteLink,
            inline: false,
          }
        )
        .setFooter({ text: `Guild #${client.guilds.cache.size}` })

      await client.joinLeaveWebhook.send({
        username: 'Join',
        avatarURL: client.user.displayAvatarURL(),
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
