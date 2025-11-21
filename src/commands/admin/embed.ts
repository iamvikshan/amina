import {
  ApplicationCommandOptionType,
  ChannelType,
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  Message,
} from 'discord.js'
import type { TextBasedChannel } from 'discord.js'
import { isValidColor, isHex } from '@helpers/Utils'

const command: CommandData = {
  name: 'embed',
  description: 'Send a beautiful embed message!',
  category: 'ADMIN',
  userPermissions: ['ManageMessages'],
  slashCommand: {
    enabled: true,
    ephemeral: true,
    options: [
      {
        name: 'channel',
        description: 'Choose a channel to send the embed',
        type: ApplicationCommandOptionType.Channel,
        channelTypes: [ChannelType.GuildText],
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('channel', true)
    if (!(channel as any).canSendEmbeds()) {
      return interaction.followUp(
        "Oh no! 😢 I can't send embeds in that channel! Please choose another one."
      )
    }
    interaction.followUp(
      `✨ Embed setup started in ${channel}! Let's create something pretty!`
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
    content: 'Click the button below to get started! 🚀',
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('EMBED_ADD')
          .setLabel('Create Embed 💖')
          .setStyle(ButtonStyle.Primary)
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
      content: 'No response received 😔. Embed setup cancelled.',
      components: [],
    })
  }

  await btnInteraction.showModal(
    new ModalBuilder({
      customId: 'EMBED_MODAL',
      title: '✨ Embed Generator ✨',
      components: [
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Embed Title 🎉')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('author')
            .setLabel('Embed Author 👩‍🎨')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Embed Description 📝')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Embed Color 🎨 (Hex code)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId('footer')
            .setLabel('Embed Footer ✍️')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
      ],
    })
  )

  // Receive modal input
  const modal = await btnInteraction
    .awaitModalSubmit({
      time: 1 * 60 * 1000,
      filter: m =>
        m.customId === 'EMBED_MODAL' &&
        !!m.member &&
        (m.member as GuildMember).id === member.id &&
        m.message?.id === sentMsg.id,
    })
    .catch(_ex => undefined)

  if (!modal) {
    return sentMsg.edit({
      content: 'No response received, cancelling setup 🥺',
      components: [],
    })
  }

  modal.reply({ content: '🌟 Embed sent!', ephemeral: true }).catch(_ex => {})

  const title = modal.fields.getTextInputValue('title')
  const author = modal.fields.getTextInputValue('author')
  const description = modal.fields.getTextInputValue('description')
  const footer = modal.fields.getTextInputValue('footer')
  const color = modal.fields.getTextInputValue('color')

  if (!title && !author && !description && !footer) {
    return sentMsg.edit({
      content:
        "Oops! 🙈 You can't send an empty embed! Please add some content.",
      components: [],
    })
  }

  const embed = new EmbedBuilder()
  if (title) embed.setTitle(title)
  if (author) embed.setAuthor({ name: author })
  if (description) embed.setDescription(description)
  if (footer) embed.setFooter({ text: footer })
  if ((color && isValidColor(color)) || (color && isHex(color))) {
    embed.setColor(color as any)
  }

  // Add/remove field button
  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('EMBED_FIELD_ADD')
      .setLabel('Add Field 🌟')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('EMBED_FIELD_REM')
      .setLabel('Remove Field ❌')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('EMBED_FIELD_DONE')
      .setLabel('Done ✅')
      .setStyle(ButtonStyle.Primary)
  )

  await sentMsg.edit({
    content:
      '✨ Please add fields using the buttons below. Click "Done" when you are ready! ✨',
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
          title: '🌟 Add Field 🌟',
          components: [
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('name')
                .setLabel('Field Name 🏷️')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('value')
                .setLabel('Field Value 📖')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId('inline')
                .setLabel('Inline? (true/false) 🌈')
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
          filter: m =>
            m.customId === 'EMBED_ADD_FIELD_MODAL' &&
            m.member &&
            (m.member as GuildMember).id === member.id,
        })
        .catch(_ex => undefined)

      if (!modal) return sentMsg.edit({ components: [] })

      modal
        .reply({ content: '🎉 Field added!', ephemeral: true })
        .catch(_ex => {})

      const name = modal.fields.getTextInputValue('name')
      const value = modal.fields.getTextInputValue('value')
      let inline: boolean | string = modal.fields
        .getTextInputValue('inline')
        .toLowerCase()

      if (inline === 'true') inline = true
      else if (inline === 'false') inline = false
      else inline = true // default to true

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
        interaction.reply({ content: '🔴 Field removed!', ephemeral: true })
      } else {
        interaction.reply({
          content: 'Oops! 😅 There are no fields to remove!',
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
