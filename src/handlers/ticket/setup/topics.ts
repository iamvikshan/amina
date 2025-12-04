import {
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  ChannelType,
  ButtonStyle,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { getSettings, updateSettings } from '@schemas/Guild'

/**
 * Show topics management submenu
 */
export async function showTopicsMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  if (!interaction.guild) {
    await interaction.editReply({
      embeds: [MinaEmbed.error('this command can only be used in a server.')],
    })
    return
  }

  const settings = await getSettings(interaction.guild)
  const topicCount = settings.ticket.topics?.length || 0

  const embed = MinaEmbed.primary()
    .setAuthor({ name: 'manage ticket topics' })
    .setDescription(
      `manage your ticket topics to help organize support requests.\n\n` +
        `**current topics:** ${topicCount} topic(s)\n\n` +
        '**options:**\n' +
        '**list topics** - view all current topics\n' +
        '**add topic** - add a new topic\n' +
        '**remove topic** - remove an existing topic\n\n' +
        'select an option below:'
    )
    .setFooter({ text: 'topics help categorize tickets' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:menu:topics')
      .setPlaceholder('select a topics option...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('list topics')
          .setDescription('view all current ticket topics')
          .setValue('list'),
        new StringSelectMenuOptionBuilder()
          .setLabel('add topic')
          .setDescription('add a new ticket topic')
          .setValue('add'),
        new StringSelectMenuOptionBuilder()
          .setLabel('remove topic')
          .setDescription('remove an existing topic')
          .setValue('remove')
          .setDefault(false) // Never auto-select this option
      )
  )

  // Disable remove if no topics
  if (topicCount === 0) {
    menu.components[0].options[2].setDescription('no topics to remove')
  }

  const backRow = MinaRows.backRow('ticket:btn:back_setup')

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backRow],
  })
}

/**
 * Handle topics menu selection
 */
export async function handleTopicsMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const option = interaction.values[0]

  switch (option) {
    case 'list':
      await interaction.deferUpdate()
      await showTopicsList(interaction)
      break
    case 'add':
      await showAddTopicModal(interaction)
      break
    case 'remove':
      await interaction.deferUpdate()
      await showRemoveTopicSelect(interaction)
      break
    default:
      await interaction.reply({
        content: 'invalid topics option',
        flags: MessageFlags.Ephemeral,
      })
  }
}

/**
 * Show list of all topics
 */
async function showTopicsList(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  if (!interaction.guild) {
    await interaction.editReply({
      embeds: [MinaEmbed.error('this command can only be used in a server.')],
    })
    return
  }

  const settings = await getSettings(interaction.guild)
  const topics = settings.ticket.topics || []

  const embed = MinaEmbed.primary()
    .setAuthor({ name: 'ticket topics list' })
    .setFooter({ text: 'use the menu to manage topics' })

  if (topics.length === 0) {
    embed.setDescription(
      "there aren't any ticket topics yet.\n\n" +
        "let's add some to make the ticketing system organized.\n\n" +
        'use the **add topic** option to get started.'
    )
  } else {
    const topicList = topics
      .map((t: any, index: number) => `${index + 1}. **${t.name}**`)
      .join('\n')
    embed.setDescription(
      `here are all the current ticket topics.\n\n` +
        `**total topics:** ${topics.length}\n\n` +
        `${topicList}\n\n` +
        'you can add more or remove them using the menu below.'
    )
  }

  const backRow = MinaRows.backRow('ticket:btn:back_topics')

  await interaction.editReply({
    embeds: [embed],
    components: [backRow],
  })
}

/**
 * Show modal for adding a topic
 */
async function showAddTopicModal(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const modal = new ModalBuilder({
    customId: 'ticket:modal:topic_add',
    title: 'add ticket topic',
    components: [
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder({
          customId: 'name',
          label: 'topic name',
          style: TextInputStyle.Short,
          placeholder: 'e.g., technical support, billing, general',
          required: true,
          maxLength: 50,
        })
      ),
    ],
  })

  await interaction.showModal(modal)
}

/**
 * Handle add topic modal submission
 */
export async function handleAddTopicModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!interaction.guild) {
    await interaction.editReply({
      embeds: [MinaEmbed.error('this command can only be used in a server.')],
    })
    return
  }

  const topicName = interaction.fields.getTextInputValue('name').trim()

  if (!topicName) {
    await interaction.editReply({
      embeds: [MinaEmbed.error('you forgot to enter a topic name. try again.')],
    })
    return
  }

  const settings = await getSettings(interaction.guild)
  const topics = settings.ticket.topics || []

  // Check if topic already exists (case-insensitive)
  const topicExists = topics.some(
    (t: any) => t.name.toLowerCase() === topicName.toLowerCase()
  )

  if (topicExists) {
    await interaction.editReply({
      embeds: [
        MinaEmbed.error(
          `the topic \`${topicName}\` is already on the list. no need to add it again.`
        ),
      ],
    })
    return
  }

  // Add topic
  settings.ticket.topics.push({ name: topicName })
  if (!interaction.guild) {
    await interaction.editReply({
      embeds: [MinaEmbed.error('this command can only be used in a server.')],
    })
    return
  }
  await updateSettings(interaction.guild.id, settings)

  // Create Discord category for this topic
  const guild = interaction.guild
  const staffRoles = settings.server.staff_roles || []
  const categoryPerms: any[] = [
    {
      id: guild.roles.everyone,
      deny: ['ViewChannel'],
    },
  ]

  if (guild.members.me) {
    categoryPerms.push({
      id: guild.members.me,
      allow: [
        'ViewChannel',
        'SendMessages',
        'ReadMessageHistory',
        'ManageChannels',
      ],
    })
  }

  categoryPerms.push({
    id: interaction.user.id,
    allow: [
      'ViewChannel',
      'SendMessages',
      'ReadMessageHistory',
      'ManageChannels',
    ],
  })

  // Add staff roles to category
  staffRoles.forEach((roleId: string) => {
    const role = guild.roles.cache.get(roleId)
    if (role) {
      categoryPerms.push({
        id: role,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
      })
    }
  })

  // Create category for topic
  try {
    await guild.channels.create({
      name: topicName,
      type: ChannelType.GuildCategory,
      permissionOverwrites: categoryPerms,
    })
  } catch (_error) {
    // Category creation failed, but topic is still added
    // Continue with success message
  }

  const successEmbed = MinaEmbed.success(
    `added the topic \`${topicName}\` to the list.\n\n` +
      'a discord category has been created for this topic.\n' +
      'users can now select this topic when creating tickets.'
  )

  const backRow = MinaRows.backRow('ticket:btn:back_topics')

  await interaction.editReply({
    embeds: [successEmbed],
    components: [backRow],
  })
}

/**
 * Show select menu for removing a topic
 */
async function showRemoveTopicSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  if (!interaction.guild) {
    await interaction.editReply({
      embeds: [MinaEmbed.error('this command can only be used in a server.')],
    })
    return
  }

  const settings = await getSettings(interaction.guild)
  const topics = settings.ticket.topics || []

  if (topics.length === 0) {
    const embed = MinaEmbed.warning('there are no topics to remove.')

    const backRow = MinaRows.backRow('ticket:btn:back_topics')

    await interaction.editReply({
      embeds: [embed],
      components: [backRow],
    })
    return
  }

  const embed = MinaEmbed.primary()
    .setAuthor({ name: 'remove ticket topic' })
    .setDescription(
      'select the topic you want to remove from the list below.\n\n' +
        '**warning:** this action cannot be undone.'
    )
    .setFooter({ text: 'choose carefully' })

  const options = topics
    .slice(0, 25)
    .map((t: any) =>
      new StringSelectMenuOptionBuilder().setLabel(t.name).setValue(t.name)
    )

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:menu:topic_remove')
      .setPlaceholder('select a topic to remove...')
      .addOptions(options)
  )

  const backRow = MinaRows.backRow('ticket:btn:back_topics')

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backRow],
  })
}

/**
 * Handle topic removal selection
 */
export async function handleRemoveTopicSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const topicName = interaction.values[0]

  await interaction.deferUpdate()

  // Show confirmation
  const embed = MinaEmbed.warning()
    .setAuthor({ name: 'confirm topic removal' })
    .setDescription(
      `are you sure you want to remove the topic **${topicName}**?\n\n` +
        'this action cannot be undone.'
    )

  const confirmRow = MinaRows.from(
    MinaButtons.custom(
      `ticket:btn:topic_remove_confirm|topic:${topicName}`,
      'confirm remove',
      ButtonStyle.Danger
    ),
    MinaButtons.nah('ticket:btn:topic_remove_cancel')
  )

  await interaction.editReply({
    embeds: [embed],
    components: [confirmRow],
  })
}

/**
 * Handle topic removal confirmation
 */
export async function handleRemoveTopicConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  // Extract topic name from custom_id
  // Format: ticket:btn:topic_remove_confirm|topic:${topicName}
  const parts = interaction.customId.split('|')
  const topicPart = parts[1] // Should be "topic:${topicName}"
  const topicName = topicPart?.split(':')[1]

  if (!topicName) {
    await interaction.editReply({
      embeds: [MinaEmbed.error('invalid topic data')],
    })
    return
  }

  if (!interaction.guild) {
    await interaction.editReply({
      embeds: [MinaEmbed.error('this command can only be used in a server.')],
    })
    return
  }

  const settings = await getSettings(interaction.guild)
  const topics = settings.ticket.topics || []

  // Check if topic exists
  const topicExists = topics.some(
    (t: any) => t.name.toLowerCase() === topicName.toLowerCase()
  )

  if (!topicExists) {
    await interaction.editReply({
      embeds: [
        MinaEmbed.error(
          `couldn't find the topic \`${topicName}\`. are you sure it's on the list?`
        ),
      ],
      components: [],
    })
    return
  }

  // Remove topic from database
  settings.ticket.topics = topics.filter(
    (t: any) => t.name.toLowerCase() !== topicName.toLowerCase()
  )
  await updateSettings(interaction.guild.id, settings)

  // Delete Discord category if it exists
  const guild = interaction.guild
  let category = guild.channels.cache.find(
    ch => ch?.type === ChannelType.GuildCategory && ch?.name === topicName
  )

  // If not in cache, try to find it by searching all channels
  if (!category) {
    const allChannels = await guild.channels.fetch()
    category = allChannels.find(
      ch => ch?.type === ChannelType.GuildCategory && ch?.name === topicName
    ) as any
  }

  let categoryDeleted = false
  if (category) {
    try {
      await category.delete()
      categoryDeleted = true
    } catch (_error) {
      // Category deletion failed, but topic is still removed from DB
      // Continue with success message
    }
  }

  const successEmbed = MinaEmbed.success(
    `removed the topic \`${topicName}\` from the list.\n\n` +
      (categoryDeleted
        ? 'the discord category has also been deleted.'
        : category
          ? "the topic was removed, but i couldn't delete the category (it may have been deleted already or i lack permissions)."
          : 'the topic was removed. no discord category was found (it may have been deleted already).')
  )

  const backRow = MinaRows.backRow('ticket:btn:back_topics')

  await interaction.editReply({
    embeds: [successEmbed],
    components: [backRow],
  })
}

/**
 * Handle topic removal cancellation
 */
export async function handleRemoveTopicCancel(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showRemoveTopicSelect(interaction as any)
}

/**
 * Handle back button to topics menu
 */
export async function handleBackToTopics(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()
  await showTopicsMenu(interaction)
}
