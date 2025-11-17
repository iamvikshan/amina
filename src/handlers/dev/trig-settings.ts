import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { getSettings } from '@schemas/Guild'
import { createSecondaryBtn, createSuccessBtn } from '@helpers/componentHelper'
import type { Client, Guild } from 'discord.js'

/**
 * Show trigger settings menu
 */
export async function showTrigSettings(
  interaction: StringSelectMenuInteraction | ButtonInteraction
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('⚡ Trigger Settings')
    .setDescription(
      'Trigger server onboarding for servers! ⚡\n\n' +
        '**Select a server (optional):**\n' +
        "If no server is selected, onboarding will be triggered for all servers that haven't completed setup.\n\n" +
        '⚠️ **Note:** This will trigger the `guildCreate` event for the selected server(s).'
    )
    .setFooter({ text: 'Select a server channel (optional)' })

  const channelSelect =
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('dev:channel:trig_settings')
        .setPlaceholder('Select a server channel (optional)')
        .setChannelTypes(ChannelType.GuildText)
        .setMinValues(0)
        .setMaxValues(1)
    )

  const backButton = createSecondaryBtn({
    customId: 'dev:btn:back_trig',
    label: 'Back to Dev Hub',
    emoji: '◀️',
  })

  const confirmButton = createSuccessBtn({
    customId: 'dev:btn:trig_confirm',
    label: 'Trigger for All Servers',
    emoji: '⚡',
  })

  await interaction.editReply({
    embeds: [embed],
    components: [channelSelect, backButton, confirmButton],
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
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setDescription('❌ Guild not found')

      await interaction.editReply({
        embeds: [errorEmbed],
        components: [
          createSecondaryBtn({
            customId: 'dev:btn:back_trig',
            label: 'Back to Dev Hub',
            emoji: '◀️',
          }),
        ],
      })
      return
    }

    const settings = await getSettings(guild)
    if (settings.server.setup_completed) {
      const errorEmbed = new EmbedBuilder()
        .setColor(EMBED_COLORS.WARNING)
        .setDescription(`❌ Guild ${guild.name} already set up`)

      await interaction.editReply({
        embeds: [errorEmbed],
        components: [
          createSecondaryBtn({
            customId: 'dev:btn:back_trig',
            label: 'Back to Dev Hub',
            emoji: '◀️',
          }),
        ],
      })
      return
    }

    guildCreateEvent(guild)

    const successEmbed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(`✅ Triggered settings for ${guild.name}`)

    await interaction.editReply({
      embeds: [successEmbed],
      components: [
        createSecondaryBtn({
          customId: 'dev:btn:back_trig',
          label: 'Back to Dev Hub',
          emoji: '◀️',
        }),
      ],
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

  const successEmbed = new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setDescription(
      `✅ Triggered settings for ${count} guild${count !== 1 ? 's' : ''}`
    )

  await interaction.editReply({
    embeds: [successEmbed],
    components: [
      createSecondaryBtn({
        customId: 'dev:btn:back_trig',
        label: 'Back to Dev Hub',
        emoji: '◀️',
      }),
    ],
  })
}
