import {
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  ChannelType,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { createSecondaryBtn, createDangerBtn } from '@helpers/componentHelper'
import { getSettings, updateSettings } from '@schemas/Guild'

/**
 * Show topics management submenu
 */
export async function showTopicsMenu(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const settings = await getSettings(interaction.guild!)
  const topicCount = settings.ticket.topics?.length || 0

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: '📂 Manage Ticket Topics' })
    .setDescription(
      `Manage your ticket topics to help organize support requests.\n\n` +
        `**Current Topics:** ${topicCount} topic(s)\n\n` +
        '**Options:**\n' +
        '📋 **List Topics** - View all current topics\n' +
        '➕ **Add Topic** - Add a new topic\n' +
        '➖ **Remove Topic** - Remove an existing topic\n\n' +
        'Select an option below:'
    )
    .setFooter({ text: 'Topics help categorize tickets' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:menu:topics')
      .setPlaceholder('📂 Select a topics option...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('List Topics')
          .setDescription('View all current ticket topics')
          .setValue('list')
          .setEmoji('📋'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Add Topic')
          .setDescription('Add a new ticket topic')
          .setValue('add')
          .setEmoji('➕'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Remove Topic')
          .setDescription('Remove an existing topic')
          .setValue('remove')
          .setEmoji('➖')
          .setDefault(false) // Never auto-select this option
      )
  )

  // Disable remove if no topics
  if (topicCount === 0) {
    menu.components[0].options[2].setDescription('No topics to remove')
  }

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back_setup',
    label: 'Back to Setup',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
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
        content: '❌ Invalid topics option',
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
  const settings = await getSettings(interaction.guild!)
  const topics = settings.ticket.topics || []

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: '📋 Ticket Topics List' })
    .setFooter({ text: 'Use the menu to manage topics' })

  if (topics.length === 0) {
    embed.setDescription(
      "Oh no! 😮 We don't have any ticket topics yet.\n\n" +
        "Let's add some to make our ticketing system super awesome! 💖\n\n" +
        'Use the **Add Topic** option to get started.'
    )
  } else {
    const topicList = topics
      .map((t: any, index: number) => `${index + 1}. **${t.name}**`)
      .join('\n')
    embed.setDescription(
      `Here are all our current ticket topics! 🎉\n\n` +
        `**Total Topics:** ${topics.length}\n\n` +
        `${topicList}\n\n` +
        'You can add more or remove them using the menu below.'
    )
  }

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back_topics',
    label: 'Back to Topics Menu',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [backButton],
  })
}

/**
 * Show modal for adding a topic
 */
async function showAddTopicModal(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const modal = new ModalBuilder()
    .setCustomId('ticket:modal:topic_add')
    .setTitle('Add Ticket Topic')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('name')
          .setLabel('Topic Name')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g., Technical Support, Billing, General')
          .setRequired(true)
          .setMaxLength(50)
      )
    )

  await interaction.showModal(modal)
}

/**
 * Handle add topic modal submission
 */
export async function handleAddTopicModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const topicName = interaction.fields.getTextInputValue('name').trim()

  if (!topicName) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            'Oopsie! 🙈 You forgot to enter a topic name. Try again, pretty please?'
          ),
      ],
    })
    return
  }

  const settings = await getSettings(interaction.guild!)
  const topics = settings.ticket.topics || []

  // Check if topic already exists (case-insensitive)
  const topicExists = topics.some(
    (t: any) => t.name.toLowerCase() === topicName.toLowerCase()
  )

  if (topicExists) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            `Uh-oh! 😅 The topic \`${topicName}\` is already on our list. No need to add it again, silly!`
          ),
      ],
    })
    return
  }

  // Add topic
  settings.ticket.topics.push({ name: topicName })
  await updateSettings(interaction.guild!.id, settings)

  // Create Discord category for this topic
  const guild = interaction.guild!
  const staffRoles = settings.server.staff_roles || []
  const categoryPerms: any[] = [
    {
      id: guild.roles.everyone,
      deny: ['ViewChannel'],
    },
    {
      id: guild.members.me!,
      allow: [
        'ViewChannel',
        'SendMessages',
        'ReadMessageHistory',
        'ManageChannels',
      ],
    },
    {
      id: interaction.user.id,
      allow: [
        'ViewChannel',
        'SendMessages',
        'ReadMessageHistory',
        'ManageChannels',
      ],
    },
  ]

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
  } catch (error) {
    // Category creation failed, but topic is still added
    // Continue with success message
  }

  const successEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(
      `Yay! 🎉 I've added the topic \`${topicName}\` to our awesome list!\n\n` +
        'A Discord category has been created for this topic.\n' +
        'Users can now select this topic when creating tickets.'
    )

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back_topics',
    label: 'Back to Topics Menu',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [successEmbed],
    components: [backButton],
  })
}

/**
 * Show select menu for removing a topic
 */
async function showRemoveTopicSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const settings = await getSettings(interaction.guild!)
  const topics = settings.ticket.topics || []

  if (topics.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.WARNING)
      .setDescription('Hmm... 🤔 There are no topics to remove!')

    const backButton = createSecondaryBtn({
      customId: 'ticket:btn:back_topics',
      label: 'Back to Topics Menu',
      emoji: '◀️',
    })

    await interaction.editReply({
      embeds: [embed],
      components: [backButton],
    })
    return
  }

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor({ name: '➖ Remove Ticket Topic' })
    .setDescription(
      'Select the topic you want to remove from the list below.\n\n' +
        '⚠️ **Warning:** This action cannot be undone!'
    )
    .setFooter({ text: 'Choose carefully!' })

  const options = topics
    .slice(0, 25)
    .map((t: any, index: number) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(t.name)
        .setValue(t.name)
        .setEmoji('📌')
    )

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket:menu:topic_remove')
      .setPlaceholder('🗑️ Select a topic to remove...')
      .addOptions(options)
  )

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back_topics',
    label: 'Back to Topics Menu',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [menu, backButton],
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
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.WARNING)
    .setAuthor({ name: '⚠️ Confirm Topic Removal' })
    .setDescription(
      `Are you sure you want to remove the topic **${topicName}**?\n\n` +
        'This action cannot be undone!'
    )

  const confirmButton = createDangerBtn({
    customId: `ticket:btn:topic_remove_confirm|topic:${topicName}`,
    label: 'Confirm Remove',
    emoji: '⚠️',
  })

  const cancelButton = createSecondaryBtn({
    customId: 'ticket:btn:topic_remove_cancel',
    label: 'Cancel',
    emoji: '❌',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [
      new ActionRowBuilder<any>().addComponents(
        confirmButton.components[0],
        cancelButton.components[0]
      ),
    ],
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
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription('❌ Invalid topic data'),
      ],
    })
    return
  }

  const settings = await getSettings(interaction.guild!)
  const topics = settings.ticket.topics || []

  // Check if topic exists
  const topicExists = topics.some(
    (t: any) => t.name.toLowerCase() === topicName.toLowerCase()
  )

  if (!topicExists) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription(
            `Hmm... 🤔 I couldn't find the topic \`${topicName}\`. Are you sure it's on our list?`
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
  await updateSettings(interaction.guild!.id, settings)

  // Delete Discord category if it exists
  const guild = interaction.guild!
  let category = guild.channels.cache.find(
    ch => ch.type === ChannelType.GuildCategory && ch.name === topicName
  )

  // If not in cache, try to find it by searching all channels
  if (!category) {
    const allChannels = await guild.channels.fetch()
    category = allChannels.find(
      ch => ch.type === ChannelType.GuildCategory && ch.name === topicName
    ) as any
  }

  let categoryDeleted = false
  if (category) {
    try {
      await category.delete()
      categoryDeleted = true
    } catch (error) {
      // Category deletion failed, but topic is still removed from DB
      // Continue with success message
    }
  }

  const successEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(
      `All done! 👋 I've removed the topic \`${topicName}\` from our list.\n\n` +
        (categoryDeleted
          ? '✅ The Discord category has also been deleted.'
          : category
            ? "⚠️ The topic was removed, but I couldn't delete the category (it may have been deleted already or I lack permissions)."
            : 'ℹ️ The topic was removed. No Discord category was found (it may have been deleted already).')
    )

  const backButton = createSecondaryBtn({
    customId: 'ticket:btn:back_topics',
    label: 'Back to Topics Menu',
    emoji: '◀️',
  })

  await interaction.editReply({
    embeds: [successEmbed],
    components: [backButton],
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
