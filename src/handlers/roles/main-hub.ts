import {
  StringSelectMenuInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} from 'discord.js'
import { showCleanupMethodMenu } from './cleanup/method-select'
import { showAutoroleMenu } from './autorole'
import { showCreateRoleMenu } from './create'
import { showAddToUserMenu } from './add-to-user'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'

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
        content: 'invalid operation selected',
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

  const embed = MinaEmbed.primary()
    .setTitle('roles management hub')
    .setDescription(
      'choose an operation below to get started.\n\n' +
        '**cleanup** - bulk delete roles by various criteria\n' +
        '**create role** - create a new role with custom settings\n' +
        '**autorole** - manage automatic role assignment\n' +
        '**add to user** - assign roles to multiple users'
    )
    .setFooter({ text: 'select an operation from the menu below' })

  const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('roles:menu:operation')
      .setPlaceholder('Choose a roles operation')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('cleanup roles')
          .setDescription('bulk delete roles by criteria')
          .setValue('cleanup'),
        new StringSelectMenuOptionBuilder()
          .setLabel('create role')
          .setDescription('create a new role with custom settings')
          .setValue('create'),
        new StringSelectMenuOptionBuilder()
          .setLabel('autorole')
          .setDescription('automatic role assignment')
          .setValue('autorole'),
        new StringSelectMenuOptionBuilder()
          .setLabel('add to user')
          .setDescription('assign roles to multiple users')
          .setValue('add2user'),
      ])
  )

  await interaction.editReply({
    embeds: [embed],
    components: [menuRow],
  })
}
