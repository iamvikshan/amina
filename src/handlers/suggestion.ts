import { getSettings } from '@schemas/Guild'
import { findSuggestion, deleteSuggestionDb } from '@schemas/Suggestions'
import { SUGGESTIONS } from '@src/config'

import {
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  EmbedBuilder,
  ButtonStyle,
  TextInputStyle,
  Message,
  GuildMember,
  TextBasedChannel,
  ButtonInteraction,
  ModalSubmitInteraction,
} from 'discord.js'
import { stripIndents } from 'common-tags'

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
    return stripIndents`
  _Upvotes: NA_
  _Downvotes: NA_
  `
  } else {
    return stripIndents`
  _Upvotes: ${upVotes} [${Math.round((upVotes / (upVotes + downVotes)) * 100)}%]_
  _Downvotes: ${downVotes} [${Math.round((downVotes / (upVotes + downVotes)) * 100)}%]_
  `
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
  if (!guild) return 'Guild not found'

  const settings = (await getSettings(guild)) as any

  // validate permissions
  if (!hasPerms(member, settings))
    return "You don't have permission to approve suggestions!"

  // validate if document exists
  const doc = (await findSuggestion(guild.id, messageId)) as any
  if (!doc) return 'Suggestion not found'
  if (doc.status === 'APPROVED') return 'Suggestion already approved'

  let message: Message
  try {
    message = await channel.messages.fetch(messageId)
  } catch (_err) {
    return 'Suggestion message not found'
  }

  let buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('SUGGEST_APPROVE')
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('SUGGEST_REJECT')
      .setLabel('Reject')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('SUGGEST_DELETE')
      .setLabel('Delete')
      .setStyle(ButtonStyle.Secondary)
  )

  const approvedEmbed = new EmbedBuilder()
    .setDescription(message.embeds[0].data.description || null)
    .setColor(SUGGESTIONS.APPROVED_EMBED as any)
    .setAuthor({ name: 'Suggestion Approved' })
    .setFooter({
      text: `Approved By ${member.user.username}`,
      iconURL: member.displayAvatarURL(),
    })
    .setTimestamp()

  const fields: any[] = []

  // add stats if it doesn't exist
  const statsField = message.embeds[0].fields.find(
    field => field.name === 'Stats'
  )
  if (!statsField) {
    const [upVotes, downVotes] = getStats(message)
    doc.stats.upvotes = upVotes
    doc.stats.downvotes = downVotes
    fields.push({ name: 'Stats', value: getVotesMessage(upVotes, downVotes) })
  } else {
    fields.push(statsField)
  }

  // update reason
  if (reason) fields.push({ name: 'Reason', value: '```' + reason + '```' })

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
    return 'Suggestion approved'
  } catch (ex) {
    ;(guild.client as any).logger.error('approveSuggestion', ex)
    return 'Failed to approve suggestion'
  }
}

async function rejectSuggestion(
  member: GuildMember,
  channel: TextBasedChannel,
  messageId: string,
  reason?: string
): Promise<string> {
  const { guild } = member
  if (!guild) return 'Guild not found'

  const settings = (await getSettings(guild)) as any

  // validate permissions
  if (!hasPerms(member, settings))
    return "You don't have permission to reject suggestions!"

  // validate if document exists
  const doc = (await findSuggestion(guild.id, messageId)) as any
  if (!doc) return 'Suggestion not found'
  if (doc.is_rejected) return 'Suggestion already rejected'

  let message: Message
  try {
    message = await channel.messages.fetch(messageId)
  } catch (_err) {
    return 'Suggestion message not found'
  }

  let buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('SUGGEST_APPROVE')
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('SUGGEST_REJECT')
      .setLabel('Reject')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('SUGGEST_DELETE')
      .setLabel('Delete')
      .setStyle(ButtonStyle.Secondary)
  )

  const rejectedEmbed = new EmbedBuilder()
    .setDescription(message.embeds[0].data.description || null)
    .setColor(SUGGESTIONS.DENIED_EMBED as any)
    .setAuthor({ name: 'Suggestion Rejected' })
    .setFooter({
      text: `Rejected By ${member.user.username}`,
      iconURL: member.displayAvatarURL(),
    })
    .setTimestamp()

  const fields: any[] = []

  // add stats if it doesn't exist
  const statsField = message.embeds[0].fields.find(
    field => field.name === 'Stats'
  )
  if (!statsField) {
    const [upVotes, downVotes] = getStats(message)
    doc.stats.upvotes = upVotes
    doc.stats.downvotes = downVotes
    fields.push({ name: 'Stats', value: getVotesMessage(upVotes, downVotes) })
  } else {
    fields.push(statsField)
  }

  // update reason
  if (reason) fields.push({ name: 'Reason', value: '```' + reason + '```' })

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

    return 'Suggestion rejected'
  } catch (ex) {
    ;(guild.client as any).logger.error('rejectSuggestion', ex)
    return 'Failed to reject suggestion'
  }
}

async function deleteSuggestion(
  member: GuildMember,
  channel: TextBasedChannel,
  messageId: string,
  reason?: string
): Promise<string> {
  const { guild } = member
  if (!guild) return 'Guild not found'

  const settings = (await getSettings(guild)) as any

  // validate permissions
  if (!hasPerms(member, settings))
    return "You don't have permission to delete suggestions!"

  try {
    await channel.messages.delete(messageId)
    await deleteSuggestionDb(guild.id, messageId, member.id, reason)
    return 'Suggestion deleted'
  } catch (ex) {
    ;(guild.client as any).logger.error('deleteSuggestion', ex)
    return 'Failed to delete suggestion! Please delete manually'
  }
}

async function handleApproveBtn(interaction: ButtonInteraction): Promise<void> {
  await interaction.showModal(
    new ModalBuilder({
      title: 'Approve Suggestion',
      customId: 'SUGGEST_APPROVE_MODAL',
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents([
          new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('reason')
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
  const response = await approveSuggestion(
    modal.member as GuildMember,
    modal.channel as TextBasedChannel,
    modal.message?.id || '',
    reason
  )
  await modal.followUp(response)
}

async function handleRejectBtn(interaction: ButtonInteraction): Promise<void> {
  await interaction.showModal(
    new ModalBuilder({
      title: 'Reject Suggestion',
      customId: 'SUGGEST_REJECT_MODAL',
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents([
          new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('reason')
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
  const response = await rejectSuggestion(
    modal.member as GuildMember,
    modal.channel as TextBasedChannel,
    modal.message?.id || '',
    reason
  )
  await modal.followUp(response)
}

async function handleDeleteBtn(interaction: ButtonInteraction): Promise<void> {
  await interaction.showModal(
    new ModalBuilder({
      title: 'Delete Suggestion',
      customId: 'SUGGEST_DELETE_MODAL',
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents([
          new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('reason')
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
  const response = await deleteSuggestion(
    modal.member as GuildMember,
    modal.channel as TextBasedChannel,
    modal.message?.id || '',
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

