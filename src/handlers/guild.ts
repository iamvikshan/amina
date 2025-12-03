import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  TextChannel,
  ButtonInteraction,
  ModalSubmitInteraction,
} from 'discord.js'
import { getSettings } from '@schemas/Guild'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

/**
 * Send onboarding menu to a channel
 */
async function sendOnboardingMenu(channel: TextChannel): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle(mina.say('guild.setup.title'))
    .setDescription(mina.say('guild.setup.description'))

  const row = MinaRows.from(
    MinaButtons.go('AMINA_SETUP').setLabel(mina.say('guild.setup.button')),
    MinaButtons.custom('AMINA_REMIND', mina.say('guild.setup.remind'), 2)
  )

  const sentMessage = await channel.send({ embeds: [embed], components: [row] })

  // Store the setup message ID
  const guildSettings = await getSettings(channel.guild)
  ;(guildSettings as any).server.setup_message_id = sentMessage.id
  await guildSettings.save()
}

/**
 * Handle setup button click
 */
async function handleSetupButton(
  interaction: ButtonInteraction
): Promise<void> {
  const updatesChannelInput = new TextInputBuilder({
    customId: 'UPDATES_CHANNEL',
    label: mina.say('guild.setup.modal.updatesChannel'),
    style: TextInputStyle.Short,
    placeholder: mina.say('guild.setup.modal.updatesPlaceholder'),
    required: true,
  })

  const staffRoleInput = new TextInputBuilder({
    customId: 'STAFF_ROLES',
    label: mina.say('guild.setup.modal.staffRole'),
    style: TextInputStyle.Short,
    placeholder: mina.say('guild.setup.modal.staffPlaceholder'),
    required: true,
  })

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    updatesChannelInput
  )
  const secondActionRow =
    new ActionRowBuilder<TextInputBuilder>().addComponents(staffRoleInput)

  const modal = new ModalBuilder({
    customId: 'AMINA_SETUP_MODAL',
    title: mina.say('guild.setup.modal.title'),
    components: [firstActionRow, secondActionRow],
  })

  await interaction.showModal(modal)
}

/**
 * Handle setup modal submission
 */
async function handleSetupModal(
  interaction: ModalSubmitInteraction
): Promise<any> {
  if (!interaction.guild) return

  const updatesChannelName =
    interaction.fields.getTextInputValue('UPDATES_CHANNEL')
  const staffRoleName = interaction.fields.getTextInputValue('STAFF_ROLES')

  const guild = interaction.guild
  const settings = await getSettings(guild)

  // Find channel and role by name
  const updatesChannel = guild.channels.cache.find(
    channel =>
      channel.name.toLowerCase() === updatesChannelName.toLowerCase() &&
      channel.type === ChannelType.GuildText
  ) as TextChannel | undefined
  const staffRole = guild.roles.cache.find(
    role => role.name.toLowerCase() === staffRoleName.toLowerCase()
  )

  if (!updatesChannel || !staffRole) {
    return interaction.reply({
      content: mina.say('guild.setup.error.notFound'),
      ephemeral: true,
    })
  }

  // Check bot permissions in the updates channel
  const botMember = guild.members.me
  if (
    !botMember ||
    !botMember
      .permissionsIn(updatesChannel)
      .has(['ViewChannel', 'SendMessages'])
  ) {
    return interaction.reply({
      content: mina.say('guild.setup.error.noPermission'),
      ephemeral: true,
    })
  }

  // Update settings
  const settingsData = settings as any
  settingsData.server.updates_channel = updatesChannel.id
  settingsData.server.staff_roles = staffRole.id
  settingsData.server.setup_completed = true
  await settings.save()

  // Send success message
  const successEmbed = MinaEmbed.success()
    .setTitle(mina.say('guild.setup.success.title'))
    .setDescription(mina.say('guild.setup.success.description'))
    .addFields(
      { name: 'updates channel', value: `${updatesChannel}`, inline: true },
      { name: 'staff role', value: `${staffRole}`, inline: true }
    )
    .setFooter({ text: mina.say('guild.setup.success.footer') })

  await interaction.reply({ embeds: [successEmbed], ephemeral: true })

  // Send a test message to the updates channel
  const testEmbed = MinaEmbed.success()
    .setTitle(mina.say('guild.setup.success.testTitle'))
    .setDescription(mina.say('guild.setup.success.testDescription'))

  await updatesChannel.send({ embeds: [testEmbed] })

  // Remove the setup message if it exists
  if (settingsData.setup_message_id) {
    const setupChannel = guild.channels.cache.find(channel =>
      (channel as any).messages?.cache?.has(settingsData.setup_message_id)
    ) as TextChannel | undefined
    if (setupChannel) {
      await setupChannel.messages
        .delete(settingsData.setup_message_id)
        .catch(() => {})
    }
    settingsData.setup_message_id = null
    await settings.save()
  }
}

/**
 * Handle remind button click
 */
async function handleRemindButton(
  interaction: ButtonInteraction
): Promise<void> {
  const reminderTimeInput = new TextInputBuilder({
    customId: 'REMINDER_TIME',
    label: mina.say('guild.setup.modal.remindLabel'),
    style: TextInputStyle.Short,
    placeholder: mina.say('guild.setup.modal.remindPlaceholder'),
    required: true,
  })

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    reminderTimeInput
  )

  const modal = new ModalBuilder({
    customId: 'AMINA_REMIND_MODAL',
    title: mina.say('guild.setup.modal.remindTitle'),
    components: [actionRow],
  })

  await interaction.showModal(modal)
}

/**
 * Handle remind modal submission
 */
async function handleRemindModal(
  interaction: ModalSubmitInteraction
): Promise<any> {
  if (!interaction.guild) return

  const reminderTime = interaction.fields.getTextInputValue('REMINDER_TIME')
  const minutes = parseInt(reminderTime)

  if (isNaN(minutes) || minutes <= 0) {
    return interaction.reply({
      content: mina.say('guild.setup.error.invalidTime'),
      ephemeral: true,
    })
  }

  const guild = interaction.guild

  // Schedule the reminder
  setTimeout(
    async () => {
      const owner = await guild.members.fetch(guild.ownerId)
      if (owner) {
        const reminderEmbed = MinaEmbed.primary()
          .setTitle(mina.say('guild.setup.reminder.title'))
          .setDescription(mina.say('guild.setup.reminder.description'))
          .setFooter({
            text: mina.say('guild.setup.reminder.footer'),
          })

        await owner.send({ embeds: [reminderEmbed] }).catch(() => {})
      }
    },
    minutes * 60 * 1000
  )

  await interaction.reply({
    content: mina.sayf('guild.setup.error.remindSuccess', { minutes }),
    ephemeral: true,
  })
}

export default {
  sendOnboardingMenu,
  handleSetupButton,
  handleSetupModal,
  handleRemindButton,
  handleRemindModal,
}
