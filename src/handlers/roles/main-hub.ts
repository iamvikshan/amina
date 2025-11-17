import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} from 'discord.js'
import { EMBED_COLORS } from '@src/config'
import { showCleanupMethodMenu } from './cleanup/method-select'
import { showAutoroleMenu } from './autorole'
import { showCreateRoleMenu } from './create'
import { showAddToUserMenu } from './add-to-user'

/**
 * Handle roles operation selection from main hub
 */
export async function handleRolesOperationMenu(
  interaction: StringSelectMenuInteraction
): Promise<void> {
  const operation = interaction.values[0]

  switch (operation) {
    case 'cleanup':
      await interaction.deferUpdate()
      await showCleanupMethodMenu(interaction)
      break
    case 'create':
      // Don't defer - showCreateRoleMenu updates immediately
      await showCreateRoleMenu(interaction as any)
      break
    case 'autorole':
      await interaction.deferUpdate()
      await showAutoroleMenu(interaction)
      break
    case 'add2user':
      // Don't defer - showAddToUserMenu updates immediately
      await showAddToUserMenu(interaction as any)
      break
    default:
      await interaction.followUp({
        content: '❌ Invalid operation selected',
        flags: MessageFlags.Ephemeral,
      })
  }
}

/**
 * Handle back button to return to main roles hub
 */
export async function handleRolesBackButton(
  interaction: ButtonInteraction
): Promise<void> {
  await interaction.deferUpdate()

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setTitle('🎭 Roles Management Hub')
    .setDescription(
      'Welcome to the Mina roles management hub! Choose an operation below to get started.\n\n' +
        '**Cleanup** - Bulk delete roles by various criteria\n' +
        '**Create Role** - Create a new role with custom settings\n' +
        '**Autorole** - Manage automatic role assignment\n' +
        '**Add to User** - Assign roles to multiple users'
    )
    .setFooter({ text: 'Select an operation from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('roles:menu:operation')
      .setPlaceholder('Choose a roles operation')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Cleanup Roles')
          .setDescription('Bulk delete roles by criteria')
          .setValue('cleanup')
          .setEmoji('🧹'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Create Role')
          .setDescription('Create a new role with custom settings')
          .setValue('create')
          .setEmoji('✨'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Autorole')
          .setDescription('Automatic role assignment')
          .setValue('autorole')
          .setEmoji('⚡'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Add to User')
          .setDescription('Assign roles to multiple users')
          .setValue('add2user')
          .setEmoji('👤'),
      ])
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menuRow],
  })
}
