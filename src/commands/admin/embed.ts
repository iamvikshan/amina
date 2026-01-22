import {
  ApplicationCommandOptionType,
  ChannelType,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
  ChatInputCommandInteraction,
  GuildMember,
  Message,
} from 'discord.js'
import type { TextBasedChannel } from 'discord.js'
import { isValidColor, isHex } from '@helpers/Utils'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

const command: CommandData = {
  name: 'embed',
  description: 'craft and send a custom embed message to any channel',
  category: 'ADMIN',
  userPermissions: ['ManageMessages'],
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'channel',
        description: 'channel to send the embed to',
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText],
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel', true)
    if (!(channel as any).canSendEmbeds()) {
      return interaction.followUp(mina.say('embed.setup.cannotSend'))
    }
    interaction.followUp(
      mina.sayf('embed.setup.started', { channel: channel.toString() })
    )
    await embedSetup(
      channel as TextBasedChannel,
      interaction.member as GuildMember
    )
    return
  },
}

async function embedSetup(
  channel: TextBasedChannel,
  member: GuildMember
): Promise<void> {
  const sentMsg = await (channel as any).send({
    content: mina.say('embed.setup.getStarted'),
    components: [
      MinaRows.from(
        MinaButtons.go('EMBED_ADD').setLabel(
          mina.say('embed.setup.createButton')
        )
      ),
    ],
  })

  const btnInteraction = await channel
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: i =>
        i.customId === 'EMBED_ADD' &&
        i.member &&
        (i.member as GuildMember).id === member.id &&
        i.message.id === sentMsg.id,
      time: 20000,
    })
    .catch(_ex => undefined)

  if (!btnInteraction) {
    return sentMsg.edit({
      content: mina.say('embed.setup.noResponse'),
      components: [],
    })
  }

  await btnInteraction.showModal(
    new ModalBuilder({
      customId: 'EMBED_MODAL',
      title: mina.say('embed.modal.title'),
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('title')
            .setPlaceholder(mina.say('embed.modal.embedTitle'))
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('author')
            .setPlaceholder(mina.say('embed.modal.embedAuthor'))
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setPlaceholder(mina.say('embed.modal.embedDescription'))
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('color')
            .setPlaceholder(mina.say('embed.modal.embedColor'))
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('footer')
            .setPlaceholder(mina.say('embed.modal.embedFooter'))
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
      ],
    })
  )

  // Receive modal input
  const modal = await btnInteraction
    .awaitModalSubmit({
      time: 60 * 1000,
      filter: m =>
        m.customId === 'EMBED_MODAL' &&
        !!m.member &&
        (m.member as GuildMember).id === member.id &&
        m.message?.id === sentMsg.id,
    })
    .catch(_ex => undefined)

  if (!modal) {
    return sentMsg.edit({
      content: mina.say('embed.setup.cancelled'),
      components: [],
    })
  }

  modal
    .reply({ content: mina.say('embed.setup.sent'), ephemeral: true })
    .catch(_ex => {})

  const title = modal.fields.getTextInputValue('title')
  const author = modal.fields.getTextInputValue('author')
  const description = modal.fields.getTextInputValue('description')
  const footer = modal.fields.getTextInputValue('footer')
  const color = modal.fields.getTextInputValue('color')

  if (!title && !author && !description && !footer) {
    return sentMsg.edit({
      content: mina.say('embed.setup.empty'),
      components: [],
    })
  }

  const embed = MinaEmbed.plain()
  if (title) embed.setTitle(title)
  if (author) embed.setAuthor({ name: author })
  if (description) embed.setDescription(description)
  if (footer) embed.setFooter({ text: footer })
  if ((color && isValidColor(color)) || (color && isHex(color))) {
    embed.setColor(color as any)
  }

  // Add/remove field button
  const buttonRow = MinaRows.from(
    MinaButtons.go('EMBED_FIELD_ADD').setLabel(
      mina.say('embed.buttons.addField')
    ),
    MinaButtons.delete('EMBED_FIELD_REM').setLabel(
      mina.say('embed.buttons.removeField')
    ),
    MinaButtons.done('EMBED_FIELD_DONE')
  )

  await sentMsg.edit({
    content: mina.say('embed.setup.addFields'),
    embeds: [embed],
    components: [buttonRow],
  })

  const collector = channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: i => i.member && (i.member as GuildMember).id === member.id,
    message: sentMsg as Message,
    idle: 5 * 60 * 1000,
  })

  collector.on('collect', async interaction => {
    if (interaction.customId === 'EMBED_FIELD_ADD') {
      await interaction.showModal(
        new ModalBuilder({
          customId: 'EMBED_ADD_FIELD_MODAL',
          title: mina.say('embed.modal.addField'),
          components: [
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('name')
                .setPlaceholder(mina.say('embed.modal.fieldName'))
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('value')
                .setPlaceholder(mina.say('embed.modal.fieldValue'))
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('inline')
                .setPlaceholder(mina.say('embed.modal.fieldInline'))
                .setStyle(TextInputStyle.Short)
                .setValue('true')
                .setRequired(true)
            ),
          ],
        })
      )

      // Receive modal input
      const modal = await interaction
        .awaitModalSubmit({
          time: 5 * 60 * 1000,
          filter: (m): boolean =>
            m.customId === 'EMBED_ADD_FIELD_MODAL' &&
            !!m.member &&
            (m.member as GuildMember).id === member.id,
        })
        .catch(_ex => undefined)

      if (!modal) return sentMsg.edit({ components: [] })

      modal
        .reply({ content: mina.say('embed.setup.fieldAdded'), ephemeral: true })
        .catch(_ex => {})

      const name = modal.fields.getTextInputValue('name')
      const value = modal.fields.getTextInputValue('value')
      const inlineStr = modal.fields
        .getTextInputValue('inline')
        .toLowerCase()
        .trim()

      // Strict validation: only accept 'true' or 'false'
      let inline: boolean
      if (inlineStr === 'true') {
        inline = true
      } else if (inlineStr === 'false' || inlineStr === '') {
        inline = false
      } else {
        await modal.reply({
          content: mina.sayf('embed.setup.invalidInline', { value: inlineStr }),
          ephemeral: true,
        })
        return
      }

      const fields = embed.data.fields || []
      fields.push({ name, value, inline })
      embed.setFields(fields)
    }

    // Remove field
    else if (interaction.customId === 'EMBED_FIELD_REM') {
      const fields = embed.data.fields
      if (fields) {
        fields.pop()
        embed.setFields(fields)
        interaction.reply({
          content: mina.say('embed.setup.fieldRemoved'),
          ephemeral: true,
        })
      } else {
        interaction.reply({
          content: mina.say('embed.setup.noFields'),
          ephemeral: true,
        })
      }
    }

    // Done
    else if (interaction.customId === 'EMBED_FIELD_DONE') {
      return collector.stop()
    }

    await sentMsg.edit({ embeds: [embed] })
  })

  collector.on('end', async (_collected, _reason) => {
    await sentMsg.edit({ content: '', components: [] })
  })
}

export default command
