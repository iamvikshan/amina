import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonStyle,
  ChatInputCommandInteraction,
} from 'discord.js'
import { timeformat } from '@helpers/Utils'
import { EMBED_COLORS, config, secret } from '@src/config'
import botstats from './sub/botstats'

import type { BotClient } from '@structures/BotClient'
import packageJson from '@root/package.json'

const command: CommandData = {
  name: 'bot',
  description: 'bot related commands',
  category: 'INFO',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'invite',
        description: "get bot's invite",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'stats',
        description: "get bot's statistics",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'uptime',
        description: "get bot's uptime",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'donate',
        description: 'donate to the bot',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'docs',
        description: "get bot's documentation",
        type: ApplicationCommandOptionType.Subcommand,
      },

      {
        name: 'ping',
        description: "get bot's ping",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'changelog',
        description: "Get the bot's mini-changelog for the latest 3 releases",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    if (!sub) return interaction.followUp('Not a valid subcommand')

    // Invite
    if (sub === 'invite') {
      const response = botInvite(interaction.client as BotClient)
      try {
        await interaction.user.send(response)
        return interaction.followUp(
          'Check your DM for my information! :envelope_with_arrow:'
        )
      } catch (_ex) {
        return interaction.followUp(
          'I cannot send you my information! Is your DM open?'
        )
      }
    }

    // Donate
    else if (sub === 'donate') {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Donate' })
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setDescription(
          'Hey there! Thanks for considering to donate to me\nUse the button below to navigate where you want'
        )

      // Buttons
      let components = []
      if (config.BOT.DONATE_URL) {
        components.push(
          new ButtonBuilder()
            .setLabel('Ko-fi')
            .setURL(config.BOT.DONATE_URL)
            .setStyle(ButtonStyle.Link)
        )
      }

      components.push(
        new ButtonBuilder()
          .setLabel('Github Sponsors')
          .setURL(`https://github.com/sponsors/iamvikshan`)
          .setStyle(ButtonStyle.Link)
      )

      components.push(
        new ButtonBuilder()
          .setLabel('Patreon')
          .setURL('https://patreon.com/vikshan')
          .setStyle(ButtonStyle.Link)
      )

      let buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        components
      )
      return interaction.followUp({ embeds: [embed], components: [buttonsRow] })
    }

    // Stats
    else if (sub === 'stats') {
      const response = botstats(interaction.client as BotClient)
      return interaction.followUp(response)
    }

    // Uptime
    else if (sub === 'uptime') {
      await interaction.followUp(
        `My Uptime: \`${timeformat(process.uptime())}\``
      )
    }

    // Docs
    else if (sub === 'docs') {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Documentation' })
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setDescription(
          'Hey there! Ah you want to know more about me? Or you are just lost? \nWell, Use the button below to see my documentation\n\nIf you are lost, you can also use the `help` command to see all my commands'
        )
        .setFooter({ text: 'Free Cookies!' })

      // Buttons
      let components = []
      components.push(
        new ButtonBuilder()
          .setLabel('Documentation')
          .setURL('https://docs.vikshan.me')
          .setStyle(ButtonStyle.Link)
      )

      let buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        components
      )
      return interaction.followUp({ embeds: [embed], components: [buttonsRow] })
    }

    // Ping
    else if (sub === 'ping') {
      const msg = await interaction.followUp('Pinging...')
      await msg.edit(
        `🏓 Pong : \`${Math.floor(interaction.client.ws.ping)}ms\``
      )
    }
    // Changelog
    else if (sub === 'changelog') {
      try {
        const githubToken = secret.GH_TOKEN
        const octokitModule = await import('@octokit/rest')
        const Octokit = octokitModule.Octokit
        const octokitOptions = githubToken ? { auth: githubToken } : {}

        const octokit = new Octokit(octokitOptions)

        // Parse owner and repo from package.json repository url
        // Format: git+https://github.com/owner/repo.git
        const repoUrl = packageJson.repository.url
        const repoMatch = repoUrl.match(/github\.com\/([^/]+)\/([^/.]+)/)
        const owner = repoMatch ? repoMatch[1] : 'iamvikshan'
        const repo = repoMatch ? repoMatch[2] : 'amina'

        const response = await octokit.repos.getContent({
          owner,
          repo,
          path: 'CHANGELOG.md',
        })

        const changelogContent = Buffer.from(
          (response.data as any).content,
          'base64'
        ).toString('utf-8')

        // Split the changelog into version blocks and get only the first two versions
        const versions = changelogContent
          .split(/(?=#\s*\[v?\d+\.\d+\.\d+\])/i)
          .filter(block => block.trim())
          .slice(0, 2)
          .map(version => {
            // Clean up the version block
            return (
              version
                .trim()
                // Remove multiple blank lines
                .replace(/\n\s*\n\s*\n/g, '\n\n')
                // Ensure proper spacing after headers
                .replace(/^(#{1,3} .+)\n(?!\n)/gm, '$1\n\n')
                // Add proper bullet points
                .replace(/^- /gm, '• ')
            )
          })

        const latestUpdates = versions.join('\n\n')

        const embed = new EmbedBuilder()
          .setAuthor({ name: 'Latest Updates' })
          .setColor(EMBED_COLORS.BOT_EMBED)
          .setDescription(
            `${latestUpdates}\n\n[**View full changelog**](https://github.com/iamvikshan/amina/blob/main/CHANGELOG.md)`
          )
          .setFooter({
            text: 'Only showing the 2 most recent updates',
          })

        return interaction.followUp({ embeds: [embed] })
      } catch (error) {
        console.error('Error fetching changelog:', error)
        return interaction.followUp(
          `Error fetching the changelog. Please try again later or view full changelog [here](https://github.com/iamvikshan/amina/blob/main/CHANGELOG.md).`
        )
      }
    }
  },
}

export default command

function botInvite(client: BotClient) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: 'Invite' })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(
      'Hey there! Thanks for considering to invite me\nUse the button below to navigate where you want'
    )

  // Buttons
  let components = []
  components.push(
    new ButtonBuilder()
      .setLabel('Invite Link')
      .setURL(client.getInvite())
      .setStyle(ButtonStyle.Link)
  )

  if (config.BOT.SUPPORT_SERVER) {
    components.push(
      new ButtonBuilder()
        .setLabel('Support Server')
        .setURL(config.BOT.SUPPORT_SERVER)
        .setStyle(ButtonStyle.Link)
    )
  }
  if (config.BOT.DASHBOARD_URL) {
    const dashboardUrl = config.BOT.DASHBOARD_URL.startsWith('http')
      ? config.BOT.DASHBOARD_URL
      : `https://${config.BOT.DASHBOARD_URL}`

    components.push(
      new ButtonBuilder()
        .setLabel('Dashboard Link')
        .setURL(dashboardUrl)
        .setStyle(ButtonStyle.Link)
    )
  }

  let buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    components
  )
  return { embeds: [embed], components: [buttonsRow] }
}
