import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { getSettings } from '@schemas/Guild'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import type { Client, Guild, ButtonBuilder } from 'discord.js'

/**
 * Show trigger settings menu
 */
export async function showTrigSettings(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle('trigger settings')
    .setDescription(
      'trigger server onboarding for servers\n\n' +
        '**select a server (optional):**\n' +
        "if no server is selected, onboarding will be triggered for all servers that haven't completed setup.\n\n" +
        '**note:** this will trigger the `guildCreate` event for the selected server(s).'
    )
    .setFooter({ text: 'select a server channel (optional)' })

  const channelSelect =
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('dev:channel:trig_settings')
        .setPlaceholder('Select a server channel (optional)')
        .setChannelTypes(ChannelType.GuildText)
        .setMinValues(0)
        .setMaxValues(1)
    )

  const backRow = MinaRows.backRow('dev:btn:back_trig')

  const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    MinaButtons.yeah()
      .setCustomId('dev:btn:trig_confirm')
      .setLabel('trigger for all servers')
  )

  await interaction.editReply({
    embeds: [embed],
    components: [channelSelect, backRow, confirmRow],
  })
}

/**
 * Handle channel select for trigger settings
 */
export async function handleTrigSettingsChannelSelect(
  interaction: ChannelSelectMenuInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const selectedChannel = interaction.channels.first()
  const serverId =
    selectedChannel && 'guildId' in selectedChannel
      ? selectedChannel.guildId
      : null

  await triggerOnboarding(interaction.client, serverId, interaction)
}

/**
 * Handle trigger confirm button (trigger for all servers)
 */
export async function handleTrigSettingsConfirm(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  await triggerOnboarding(interaction.client, null, interaction)
}

/**
 * Trigger onboarding for server(s)
 */
async function triggerOnboarding(
  client: Client,
  serverId: string | null,
  interaction: ChannelSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const guildCreateEvent = client.emit.bind(client, 'guildCreate')

  if (serverId) {
    const guild = client.guilds.cache.get(serverId)
    if (!guild) {
      const errorEmbed = MinaEmbed.error().setDescription('guild not found')

      await interaction.editReply({
        embeds: [errorEmbed],
        components: [MinaRows.backRow('dev:btn:back_trig')],
      })
      return
    }

    const settings = await getSettings(guild)
    if (settings.server.setup_completed) {
      const errorEmbed = MinaEmbed.warning().setDescription(
        `guild ${guild.name} already set up`
      )

      await interaction.editReply({
        embeds: [errorEmbed],
        components: [MinaRows.backRow('dev:btn:back_trig')],
      })
      return
    }

    guildCreateEvent(guild)

    const successEmbed = MinaEmbed.success().setDescription(
      `triggered settings for ${guild.name}`
    )

    await interaction.editReply({
      embeds: [successEmbed],
      components: [MinaRows.backRow('dev:btn:back_trig')],
    })
    return
  }

  // Trigger for all servers
  let count = 0
  for (const [, guild] of client.guilds.cache) {
    const settings = await getSettings(guild as Guild)
    if (!settings.server.setup_completed) {
      guildCreateEvent(guild)
      count++
    }
  }

  const successEmbed = MinaEmbed.success().setDescription(
    `triggered settings for ${count} guild${count !== 1 ? 's' : ''}`
  )

  await interaction.editReply({
    embeds: [successEmbed],
    components: [MinaRows.backRow('dev:btn:back_trig')],
  })
}
