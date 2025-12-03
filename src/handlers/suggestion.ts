import { getSettings } from '@schemas/Guild'
import { findSuggestion, deleteSuggestionDb } from '@schemas/Suggestions'

import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  ButtonStyle,
  TextInputStyle,
  Message,
  GuildMember,
  ButtonInteraction,
  ModalSubmitInteraction,
} from 'discord.js'
import type { TextBasedChannel } from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'
import { SUGGESTIONS } from '@src/config'

const getStats = (message: Message): [number, number] => {
  const upVotes =
    (message.reactions.resolve(SUGGESTIONS.EMOJI.UP_VOTE)?.count || 1) - 1
  const downVotes =
    (message.reactions.resolve(SUGGESTIONS.EMOJI.DOWN_VOTE)?.count || 1) - 1

  return [upVotes, downVotes]
}

const getVotesMessage = (upVotes: number, downVotes: number): string => {
  const total = upVotes + downVotes
  if (total === 0) {
    return mina.say('suggestions.stats.none')
  } else {
    const upPercent = Math.round((upVotes / total) * 100)
    const downPercent = Math.round((downVotes / total) * 100)
    return mina.sayf('suggestions.stats.votes', {
      upvotes: upVotes.toString(),
      downvotes: downVotes.toString(),
      upPercent: upPercent.toString(),
      downPercent: downPercent.toString(),
    })
  }
}

const hasPerms = (member: GuildMember, settings: any): boolean => {
  return (
    member.permissions.has('ManageGuild') ||
    !!member.roles.cache.find(r => settings.server.staff_roles.includes(r.id))
  )
}

async function approveSuggestion(
  member: GuildMember,
  channel: TextBasedChannel,
  messageId: string,
  reason?: string
): Promise<string> {
  const { guild } = member
  if (!guild) return mina.say('suggestions.error.guildNotFound')

  const settings = (await getSettings(guild)) as any

  // validate permissions
  if (!hasPerms(member, settings))
    return mina.say('suggestions.error.noPermission')

  // validate if document exists
  const doc = (await findSuggestion(guild.id, messageId)) as any
  if (!doc) return mina.say('suggestions.error.notFound')
  if (doc.status === 'APPROVED')
    return mina.say('suggestions.error.alreadyApproved')

  let message: Message
  try {
    message = await channel.messages.fetch(messageId)
  } catch (_err) {
    return mina.say('suggestions.error.messageNotFound')
  }

  let buttonsRow = MinaRows.from(
    MinaButtons.custom(
      'SUGGEST_APPROVE',
      mina.say('suggestions.buttons.approve'),
      ButtonStyle.Success,
      true
    ),
    MinaButtons.custom(
      'SUGGEST_REJECT',
      mina.say('suggestions.buttons.reject'),
      ButtonStyle.Danger
    ),
    MinaButtons.custom(
      'SUGGEST_DELETE',
      mina.say('suggestions.buttons.delete'),
      ButtonStyle.Secondary
    )
  )

  const approvedEmbed = MinaEmbed.success()
    .setDescription(message.embeds[0].data.description || null)
    .setAuthor({ name: mina.say('suggestions.approved.title') })
    .setFooter({
      text: mina.sayf('suggestions.approved.footer', {
        user: member.user.username,
      }),
      iconURL: member.displayAvatarURL(),
    })
    .setTimestamp()

  const fields: any[] = []

  // add stats if it doesn't exist
  const statsField = message.embeds[0].fields.find(
    field => field.name.toLowerCase() === 'stats'
  )
  if (!statsField) {
    const [upVotes, downVotes] = getStats(message)
    doc.stats.upvotes = upVotes
    doc.stats.downvotes = downVotes
    fields.push({
      name: mina.say('suggestions.stats.title'),
      value: getVotesMessage(upVotes, downVotes),
      inline: false,
    })
  } else {
    fields.push(statsField)
  }

  // update reason
  if (reason)
    fields.push({
      name: mina.say('suggestions.reason.title'),
      value: '```' + reason + '```',
      inline: false,
    })

  approvedEmbed.addFields(fields)

  try {
    doc.status = 'APPROVED'
    doc.status_updates.push({
      user_id: member.id,
      status: 'APPROVED',
      reason,
      timestamp: new Date(),
    })

    let approveChannel
    if (settings.suggestions.approved_channel) {
      approveChannel = guild.channels.cache.get(
        settings.suggestions.approved_channel
      )
    }

    // suggestions-approve channel is not configured
    if (!approveChannel) {
      await message.edit({ embeds: [approvedEmbed], components: [buttonsRow] })
      await message.reactions.removeAll()
    }

    // suggestions-approve channel is configured
    else {
      const sent = await (approveChannel as any).send({
        embeds: [approvedEmbed],
        components: [buttonsRow],
      })
      doc.channel_id = approveChannel.id
      doc.message_id = sent.id
      await message.delete()
    }

    await doc.save()
    return mina.say('suggestions.approved.success')
  } catch (ex) {
    ;(guild.client as any).logger.error('approveSuggestion', ex)
    return mina.say('suggestions.error.failed')
  }
}

async function rejectSuggestion(
  member: GuildMember,
  channel: TextBasedChannel,
  messageId: string,
  reason?: string
): Promise<string> {
  const { guild } = member
  if (!guild) return mina.say('suggestions.error.guildNotFound')

  const settings = (await getSettings(guild)) as any

  // validate permissions
  if (!hasPerms(member, settings))
    return mina.say('suggestions.error.noPermission')

  // validate if document exists
  const doc = (await findSuggestion(guild.id, messageId)) as any
  if (!doc) return mina.say('suggestions.error.notFound')
  if (doc.is_rejected) return mina.say('suggestions.error.alreadyRejected')

  let message: Message
  try {
    message = await channel.messages.fetch(messageId)
  } catch (_err) {
    return mina.say('suggestions.error.messageNotFound')
  }

  let buttonsRow = MinaRows.from(
    MinaButtons.custom(
      'SUGGEST_APPROVE',
      mina.say('suggestions.buttons.approve'),
      ButtonStyle.Success
    ),
    MinaButtons.custom(
      'SUGGEST_REJECT',
      mina.say('suggestions.buttons.reject'),
      ButtonStyle.Danger,
      true
    ),
    MinaButtons.custom(
      'SUGGEST_DELETE',
      mina.say('suggestions.buttons.delete'),
      ButtonStyle.Secondary
    )
  )

  const rejectedEmbed = MinaEmbed.error()
    .setDescription(message.embeds[0].data.description || null)
    .setAuthor({ name: mina.say('suggestions.rejected.title') })
    .setFooter({
      text: mina.sayf('suggestions.rejected.footer', {
        user: member.user.username,
      }),
      iconURL: member.displayAvatarURL(),
    })
    .setTimestamp()

  const fields: any[] = []

  // add stats if it doesn't exist
  const statsField = message.embeds[0].fields.find(
    field => field.name.toLowerCase() === 'stats'
  )
  if (!statsField) {
    const [upVotes, downVotes] = getStats(message)
    doc.stats.upvotes = upVotes
    doc.stats.downvotes = downVotes
    fields.push({
      name: mina.say('suggestions.stats.title'),
      value: getVotesMessage(upVotes, downVotes),
      inline: false,
    })
  } else {
    fields.push(statsField)
  }

  // update reason
  if (reason)
    fields.push({
      name: mina.say('suggestions.reason.title'),
      value: '```' + reason + '```',
      inline: false,
    })

  rejectedEmbed.addFields(fields)

  try {
    doc.status = 'REJECTED'
    doc.status_updates.push({
      user_id: member.id,
      status: 'REJECTED',
      reason,
      timestamp: new Date(),
    })

    let rejectChannel
    if (settings.suggestions.rejected_channel) {
      rejectChannel = guild.channels.cache.get(
        settings.suggestions.rejected_channel
      )
    }

    // suggestions-reject channel is not configured
    if (!rejectChannel) {
      await message.edit({ embeds: [rejectedEmbed], components: [buttonsRow] })
      await message.reactions.removeAll()
    }

    // suggestions-reject channel is configured
    else {
      const sent = await (rejectChannel as any).send({
        embeds: [rejectedEmbed],
        components: [buttonsRow],
      })
      doc.channel_id = rejectChannel.id
      doc.message_id = sent.id
      await message.delete()
    }

    await doc.save()

    return mina.say('suggestions.rejected.success')
  } catch (ex) {
    ;(guild.client as any).logger.error('rejectSuggestion', ex)
    return mina.say('suggestions.error.failed')
  }
}

async function deleteSuggestion(
  member: GuildMember,
  channel: TextBasedChannel,
  messageId: string,
  reason?: string
): Promise<string> {
  const { guild } = member
  if (!guild) return mina.say('suggestions.error.guildNotFound')

  const settings = (await getSettings(guild)) as any

  // validate permissions
  if (!hasPerms(member, settings))
    return mina.say('suggestions.error.noPermission')

  try {
    await channel.messages.delete(messageId)
    await deleteSuggestionDb(guild.id, messageId, member.id, reason || '')
    return mina.say('suggestions.deleted.success')
  } catch (ex) {
    ;(guild.client as any).logger.error('deleteSuggestion', ex)
    return mina.say('suggestions.deleted.failed')
  }
}

async function handleApproveBtn(interaction: ButtonInteraction): Promise<void> {
  await interaction.showModal(
    new ModalBuilder({
      title: mina.say('suggestions.modal.approve.title'),
      customId: 'SUGGEST_APPROVE_MODAL',
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents([
          new TextInputBuilder()
            .setCustomId('reason')
            .setLabel(mina.say('suggestions.modal.reason.label'))
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(4),
        ]),
      ],
    })
  )
}

async function handleApproveModal(
  modal: ModalSubmitInteraction
): Promise<void> {
  await modal.deferReply({ ephemeral: true })
  const reason = modal.fields.getTextInputValue('reason')
  const messageId = modal.message?.id
  if (!messageId) {
    await modal.followUp(mina.say('suggestions.error.messageNotFound'))
    return
  }
  const response = await approveSuggestion(
    modal.member as GuildMember,
    modal.channel as TextBasedChannel,
    messageId,
    reason
  )
  await modal.followUp(response)
}

async function handleRejectBtn(interaction: ButtonInteraction): Promise<void> {
  await interaction.showModal(
    new ModalBuilder({
      title: mina.say('suggestions.modal.reject.title'),
      customId: 'SUGGEST_REJECT_MODAL',
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents([
          new TextInputBuilder()
            .setCustomId('reason')
            .setLabel(mina.say('suggestions.modal.reason.label'))
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(4),
        ]),
      ],
    })
  )
}

async function handleRejectModal(modal: ModalSubmitInteraction): Promise<void> {
  await modal.deferReply({ ephemeral: true })
  const reason = modal.fields.getTextInputValue('reason')
  const messageId = modal.message?.id
  if (!messageId) {
    await modal.followUp(mina.say('suggestions.error.messageNotFound'))
    return
  }
  const response = await rejectSuggestion(
    modal.member as GuildMember,
    modal.channel as TextBasedChannel,
    messageId,
    reason
  )
  await modal.followUp(response)
}

async function handleDeleteBtn(interaction: ButtonInteraction): Promise<void> {
  await interaction.showModal(
    new ModalBuilder({
      title: mina.say('suggestions.modal.delete.title'),
      customId: 'SUGGEST_DELETE_MODAL',
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents([
          new TextInputBuilder()
            .setCustomId('reason')
            .setLabel(mina.say('suggestions.modal.reason.label'))
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(4),
        ]),
      ],
    })
  )
}

async function handleDeleteModal(modal: ModalSubmitInteraction): Promise<void> {
  await modal.deferReply({ ephemeral: true })
  const reason = modal.fields.getTextInputValue('reason')
  const messageId = modal.message?.id
  if (!messageId) {
    await modal.followUp(mina.say('suggestions.error.messageNotFound'))
    return
  }
  const response = await deleteSuggestion(
    modal.member as GuildMember,
    modal.channel as TextBasedChannel,
    messageId,
    reason
  )
  await modal.followUp({ content: response, ephemeral: true })
}

export default {
  handleApproveBtn,
  handleApproveModal,
  handleRejectBtn,
  handleRejectModal,
  handleDeleteBtn,
  handleDeleteModal,
  approveSuggestion,
  rejectSuggestion,
  deleteSuggestion,
}
