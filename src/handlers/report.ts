import {
  WebhookClient,
  PermissionFlagsBits,
  ChannelType,
  ModalSubmitInteraction,
  User,
} from 'discord.js'
import { FEEDBACK } from '@src/config'
import { getSettings, setInviteLink } from '@schemas/Guild'
import { getQuestionById } from '@schemas/TruthOrDare'
import type BotClient from '@structures/BotClient'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'

async function handleReportModal(
  interaction: ModalSubmitInteraction
): Promise<any> {
  const type = interaction.customId.split('_')[2]
  const title = interaction.fields.getTextInputValue('title')
  const description = interaction.fields.getTextInputValue('description')
  let additionalInfo = ''

  if (type === 'server') {
    const serverId = interaction.fields.getTextInputValue('serverId')
    try {
      const guildSettings = await getSettings({ id: serverId } as any)
      if (!guildSettings) {
        const errorEmbed = MinaEmbed.error()
          .setAuthor({ name: mina.say('report.error.serverNotFound') })
          .setDescription(
            'check the server id.\n\n' +
              '**how to find it:**\n' +
              '1. enable developer mode in settings > advanced\n' +
              '2. right-click the server icon and copy id\n\n' +
              "i can only report on servers i'm in."
          )

        await interaction.reply({
          embeds: [errorEmbed],
          ephemeral: true,
        })
        return
      }

      const settings = guildSettings as any
      additionalInfo = `Server Name: ${settings.server.name}\nServer Owner: ${settings.server.owner}\nServer ID: ${serverId}`

      // Only try to create invite if one doesn't exist
      let inviteLink = settings.server.invite_link
      if (!inviteLink) {
        const guild = await interaction.client.guilds.fetch(serverId)
        if (guild) {
          try {
            const targetChannel = guild.channels.cache.find(
              channel =>
                channel.type === ChannelType.GuildText &&
                (channel as any)
                  .permissionsFor(guild.members.me)
                  ?.has(PermissionFlagsBits.CreateInstantInvite)
            )

            if (targetChannel) {
              const invite = await (targetChannel as any).createInvite({
                maxAge: 0,
                maxUses: 0,
              })
              inviteLink = invite.url
              await setInviteLink(guild.id, inviteLink)
            }
          } catch (_error) {
            console.error('error creating invite:', _error)
          }
        }
      }

      // Send report regardless of invite link status
      const success = await sendWebhook(
        interaction.client as BotClient,
        type,
        title,
        description,
        additionalInfo,
        interaction.user,
        inviteLink
      )

      if (success) {
        const confirmationEmbed = MinaEmbed.success()
          .setAuthor({ name: mina.say('report.success.report') })
          .addFields(
            {
              name: mina.say('report.fields.title'),
              value: title,
              inline: false,
            },
            {
              name: mina.say('report.fields.description'),
              value: description,
              inline: false,
            }
          )
          .setTimestamp()

        if (additionalInfo) {
          confirmationEmbed.addFields({
            name: mina.say('report.fields.additionalInfo'),
            value: additionalInfo
              .split('\n')
              .filter(line => !line.startsWith('Server Invite:'))
              .join('\n'),
          })
        }

        await interaction.reply({
          embeds: [confirmationEmbed],
          ephemeral: true,
        })
      } else {
        await interaction.reply({
          embeds: [MinaEmbed.error(mina.say('report.error.sendFailed'))],
          ephemeral: true,
        })
      }
    } catch (_error) {
      console.error('error fetching guild settings:', _error)
      await interaction.reply({
        embeds: [MinaEmbed.error(mina.say('report.error.processFailed'))],
        ephemeral: true,
      })
    }
  } else if (type === 'user') {
    const userId = interaction.fields.getTextInputValue('userId')
    const user = await interaction.client.users.fetch(userId).catch(() => null)
    if (user) {
      additionalInfo = `Reported User: ${user.tag} (${userId})`
    } else {
      const errorEmbed = MinaEmbed.error()
        .setAuthor({ name: mina.say('report.error.userNotFound') })
        .setDescription(
          'check the user id.\n\n' +
            '**how to find it:**\n' +
            '1. enable developer mode in settings > advanced\n' +
            "2. right-click the user's name and copy id\n\n" +
            "the user might not be in any server i'm in."
        )

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      })
      return
    }
  } else if (type === 'tod') {
    const questionId = interaction.fields.getTextInputValue('questionId')
    try {
      const question = (await getQuestionById(questionId)) as any
      if (question) {
        additionalInfo = `Question ID: ${questionId}\nCategory: ${question.category}\nQuestion: ${question.question}`
      }
    } catch (_error) {
      console.error('error fetching question:', _error)
      const errorEmbed = MinaEmbed.error()
        .setAuthor({ name: mina.say('report.error.questionNotFound') })
        .setDescription(
          'check the question id.\n\n' +
            '**where to find it:**\n' +
            'look in the footer of the question after **qid:**\n' +
            'example: if it says "qid: T123", enter "T123"'
        )

      await interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      })
      return
    }
  } else if (type === 'bug') {
    additionalInfo = interaction.fields.getTextInputValue('reproSteps') || ''
  } else if (type === 'feedback') {
    additionalInfo =
      interaction.fields.getTextInputValue('additionalInfo') || ''
  }

  if (type !== 'server') {
    const success = await sendWebhook(
      interaction.client as BotClient,
      type,
      title,
      description,
      additionalInfo,
      interaction.user
    )

    if (success) {
      const successKey =
        type === 'feedback'
          ? 'report.success.feedback'
          : type === 'bug'
            ? 'report.success.bug'
            : 'report.success.report'

      const confirmationEmbed = MinaEmbed.success()
        .setAuthor({ name: mina.say(successKey) })
        .addFields(
          {
            name: mina.say('report.fields.title'),
            value: title,
            inline: false,
          },
          {
            name: mina.say('report.fields.description'),
            value: description,
            inline: false,
          }
        )
        .setTimestamp()

      if (type === 'bug') {
        confirmationEmbed.setDescription(
          `you can also check [github issues](https://github.com/iamvikshan/amina/issues/new/choose).`
        )
      }

      if (additionalInfo) {
        const fieldName =
          type === 'bug'
            ? mina.say('report.fields.reproSteps')
            : type === 'feedback'
              ? mina.say('report.fields.additionalThoughts')
              : mina.say('report.fields.additionalInfo')

        confirmationEmbed.addFields({
          name: fieldName,
          value: additionalInfo,
        })
      }

      await interaction.reply({
        embeds: [confirmationEmbed],
        ephemeral: true,
      })
    } else {
      await interaction.reply({
        embeds: [MinaEmbed.error(mina.say('report.error.sendFailed'))],
        ephemeral: true,
      })
    }
  }
}

async function sendWebhook(
  client: BotClient,
  type: string,
  title: string,
  description: string,
  additionalInfo: string,
  user: User,
  inviteLink?: string
): Promise<boolean> {
  if (!FEEDBACK.URL) {
    return false
  }
  const webhookClient = new WebhookClient({ url: FEEDBACK.URL })

  const embed = MinaEmbed.primary()
    .setAuthor({
      name: `new ${type === 'feedback' ? 'feedback' : `${type} report`}`,
    })
    .setDescription(`**title:** ${title}\n\n**description:** ${description}`)
    .setTimestamp()
    .setFooter({
      text:
        type === 'bug' || type === 'feedback'
          ? `submitted by: ${user.tag} (${user.id})`
          : `reported by: ${user.tag} (${user.id})`,
    })

  if (additionalInfo) {
    embed.addFields({
      name:
        type === 'bug'
          ? 'reproduction steps'
          : type === 'feedback'
            ? 'additional thoughts'
            : 'extra info',
      value: additionalInfo,
    })
  }

  if (inviteLink) {
    embed.addFields({
      name: 'server invite',
      value: inviteLink,
    })
  }

  try {
    await webhookClient.send({
      username: 'mina reports',
      avatarURL: client.user?.displayAvatarURL() ?? undefined,
      embeds: [embed],
    })
    return true
  } catch (_error) {
    console.error('error sending webhook:', _error)
    return false
  }
}

export default { handleReportModal }
