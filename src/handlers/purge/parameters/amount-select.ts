import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonStyle,
} from 'discord.js'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

// PurgeType is now globally available - see types/handlers.d.ts

/**
 * Show amount selection menu
 */
export async function showAmountSelect(
  interaction:
    | StringSelectMenuInteraction
    | ButtonInteraction
    | ModalSubmitInteraction,
  purgeType: PurgeType,
  additionalData?: { token?: string; userId?: string },
  isDefault?: boolean
): Promise<void> {
  const embed = MinaEmbed.primary()
    .setTitle('select amount')
    .setDescription(
      'choose how many messages to delete:\n\n' +
        '**presets:**\n' +
        '- 10 messages\n' +
        '- 25 messages\n' +
        '- 50 messages\n' +
        '- 100 messages (discord max per operation)\n' +
        '- custom (1-100)\n\n' +
        'note: maximum 500 messages per command execution.'
    )
    .setFooter({ text: 'select an amount or choose custom' })

  const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(
        `purge:menu:amount|type:${purgeType}${
          additionalData?.token
            ? `|token:${Buffer.from(additionalData.token).toString('base64')}`
            : ''
        }${additionalData?.userId ? `|user:${additionalData.userId}` : ''}${isDefault ? '|default:true' : ''}`
      )
      .setPlaceholder('select amount...')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('10 messages')
          .setDescription('delete 10 messages')
          .setValue('10'),
        new StringSelectMenuOptionBuilder()
          .setLabel('25 messages')
          .setDescription('delete 25 messages')
          .setValue('25'),
        new StringSelectMenuOptionBuilder()
          .setLabel('50 messages')
          .setDescription('delete 50 messages')
          .setValue('50'),
        new StringSelectMenuOptionBuilder()
          .setLabel('100 messages')
          .setDescription('delete 100 messages (discord max)')
          .setValue('100')
          .setDefault(isDefault === true), // Preselect 100 for default flow
        new StringSelectMenuOptionBuilder()
          .setLabel('custom amount')
          .setDescription('enter a custom amount (1-100)')
          .setValue('custom'),
      ])
  )

  const components: any[] = [menu]

  // Add Proceed button for default flow (100 preselected)
  if (isDefault) {
    const proceedRow = MinaRows.single(
      MinaButtons.custom(
        `purge:btn:proceed_amount|type:${purgeType}|amount:100${
          additionalData?.token
            ? `|token:${Buffer.from(additionalData.token).toString('base64')}`
            : ''
        }${additionalData?.userId ? `|user:${additionalData.userId}` : ''}`,
        'proceed',
        ButtonStyle.Primary
      )
    )
    components.push(proceedRow)
  }

  const backRow = MinaRows.backRow('purge:btn:back')
  components.push(backRow)

  await interaction.editReply({
    embeds: [embed],
    components,
  })
}

/**
 * Handle amount selection
 */
export async function handleAmountSelect(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const selected = interaction.values[0]
  const customId = interaction.customId

  // Parse state from custom_id
  const parts = customId.split('|')
  const typePart = parts.find(p => p.startsWith('type:'))
  const tokenPart = parts.find(p => p.startsWith('token:'))
  const userPart = parts.find(p => p.startsWith('user:'))
  const isDefault = parts.some(p => p === 'default:true')

  const purgeType = typePart?.split(':')[1] as PurgeType
  const token = tokenPart
    ? Buffer.from(tokenPart.split(':')[1], 'base64').toString()
    : undefined
  const userId = userPart?.split(':')[1]

  if (selected === 'custom') {
    // Show modal for custom amount
    const { showAmountModal } = await import('./amount-modal')
    await showAmountModal(interaction, purgeType, { token, userId })
    return
  }

  const amount = parseInt(selected, 10)

  // Validate amount
  if (amount < 1 || amount > 100) {
    await interaction.followUp({
      content: 'invalid amount, please select between 1-100 messages.',
      ephemeral: true,
    })
    return
  }

  await interaction.deferUpdate()

  // Proceed to channel selection (optional)
  // If user manually selected (not default), pass isDefault=false
  const { showChannelSelect } = await import('./channel-select')
  await showChannelSelect(
    interaction,
    purgeType,
    amount,
    { token, userId },
    !isDefault
  )
}
