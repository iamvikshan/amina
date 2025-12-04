import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { mina } from '@helpers/mina'
import responses from '@data/responses'

const command: CommandData = {
  name: 'hack',
  description: 'hack a user with real data about them, found in the wild',
  cooldown: 10,
  category: 'FUN',
  botPermissions: ['SendMessages', 'EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'target',
        description: 'user to embarrass',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('target')
    if (!target) {
      return interaction.followUp('Please provide a target user!')
    }
    if (target.bot)
      return interaction.followUp(
        "Eeek! I can't hack another bot - we might cause a paradox! 🌀"
      )

    const chaoticHackStages = responses.fun.hack.map(stage =>
      stage
        .replace('{target}', target.toString())
        .replace('{target_lower}', target.username.toLowerCase())
    )

    const initialEmbed = MinaEmbed.loading()
      .setTitle("🎮 Amina's Super Special Hack Attack!")
      .setDescription(chaoticHackStages[0])

    const message = await interaction.followUp({ embeds: [initialEmbed] })

    // Chaotic updates with random timing!
    for (let i = 1; i < chaoticHackStages.length; i++) {
      await new Promise(resolve =>
        setTimeout(resolve, 2500 + Math.random() * 1000)
      )

      const embed = MinaEmbed.loading()
        .setTitle("🎮 Amina's Super Special Hack Attack!")
        .setDescription(chaoticHackStages[i])

      await message.edit({ embeds: [embed] })
    }

    const resultsEmbed = MinaEmbed.success()
      .setTitle(mina.say('fun.hackResult.title'))
      .setDescription(
        mina.sayf('fun.hackResult.description', { target: target.toString() })
      )
      .addFields([
        {
          name: mina.say('fun.hackResult.fieldTitle'),
          value: mina.say('fun.hackResult.fieldValue'),
        },
      ])
      .setImage('https://media.tenor.com/x8v1oNUOmg4AAAAd/rickroll-roll.gif')
      .setFooter({
        text: mina.say('fun.hackResult.footer'),
      })

    try {
      await interaction.user.send({
        content: '*slides into your DMs with stolen data*',
        embeds: [resultsEmbed],
      })

      const finalEmbed = MinaEmbed.success()
        .setTitle('✨ Mission Complete! ✨')
        .setDescription(mina.say('fun.hackResult.dmSuccess'))

      await message.edit({ embeds: [finalEmbed] })
    } catch (error) {
      interaction.client.logger.error(
        'Failed to send DM in hack command:',
        error
      )
      await message.edit({
        content: mina.say('fun.hackResult.dmFail'),
        embeds: [resultsEmbed],
      })
    }
    return
  },
}

export default command
