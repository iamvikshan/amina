import {
  ChatInputCommandInteraction,
  TextChannel,
  PermissionFlagsBits,
} from 'discord.js'
import { updateSetupStatus, createSetupEmbed } from './setupEmbed'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

export default async function updateChannel(
  interaction: ChatInputCommandInteraction,
  channel: TextChannel,
  settings: any
): Promise<void> {
  if (
    !channel
      .permissionsFor(interaction.guild?.members.me as any)
      ?.has(PermissionFlagsBits.SendMessages)
  ) {
    const embed = MinaEmbed.error().setDescription(
      mina.sayf('guild.setup.error.noPermission', {
        channel: channel.toString(),
      })
    )
    await interaction.editReply({ embeds: [embed] })
    return
  }

  settings.server.updates_channel = channel.id
  await updateSetupStatus(settings)
  await settings.save()

  const setupEmbed = createSetupEmbed(settings)

  const backButton = MinaRows.backRow('admin:btn:back')

  await interaction.editReply({
    embeds: [setupEmbed],
    components: [backButton],
  })

  const notificationEmbed = MinaEmbed.primary().setDescription(
    mina.say('guild.setup.success.testDescription')
  )
  await channel.send({ embeds: [notificationEmbed] })
}
