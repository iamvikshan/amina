import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js'
import { timeformat } from '@helpers/Utils'
import { config, secret } from '@src/config'
import botstats from './sub/botstats'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'
import { Logger } from '@helpers/Logger'

import type { BotClient } from '@structures/BotClient'
import packageJson from '@root/package.json'

const command: CommandData = {
  name: 'mina',
  description: 'get info about me - stats, invite, uptime, and more',
  category: 'INFO',
  botPermissions: ['EmbedLinks'],
  slashCommand: {
    enabled: true,
    options: [
      {
        name: 'invite',
        description: 'get a link to add me to your server',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'stats',
        description: 'view system stats like memory, cpu, and server count',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'uptime',
        description: 'check how long i have been running without a restart',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'donate',
        description: 'support development through ko-fi or github sponsors',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'docs',
        description: 'access the wiki and documentation',
        type: ApplicationCommandOptionType.Subcommand,
      },

      {
        name: 'ping',
        description: 'check my response latency to discord',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'changelog',
        description: 'see the latest updates and changes',
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },

  async interactionRun(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand()
    if (!sub)
      return interaction.followUp(mina.say('botInfo.error.invalidSubcommand'))

    // Invite
    if (sub === 'invite') {
      const response = botInvite(interaction.client as BotClient)
      try {
        await interaction.user.send(response)
        return interaction.followUp(mina.say('botInfo.dm.sent'))
      } catch (_ex) {
        return interaction.followUp(mina.say('botInfo.dm.failed'))
      }
    }

    // Donate
    else if (sub === 'donate') {
      const embed = MinaEmbed.primary()
        .setAuthor({ name: mina.say('botInfo.donate.title') })
        .setThumbnail(interaction.client.user?.displayAvatarURL() ?? '')
        .setDescription(mina.say('botInfo.donate.description'))

      // Buttons
      const buttons = []
      if (config.BOT.DONATE_URL) {
        buttons.push(
          MinaButtons.link(
            config.BOT.DONATE_URL,
            mina.say('botInfo.donate.button.kofi')
          )
        )
      }

      buttons.push(
        MinaButtons.link(
          'https://github.com/sponsors/iamvikshan',
          mina.say('botInfo.donate.button.github')
        )
      )

      buttons.push(
        MinaButtons.link(
          'https://patreon.com/vikshan',
          mina.say('botInfo.donate.button.patreon')
        )
      )

      const buttonsRow = MinaRows.from(...buttons)
      return interaction.followUp({ embeds: [embed], components: [buttonsRow] })
    }

    // Stats
    else if (sub === 'stats') {
      const response = botstats(interaction.client as BotClient)
      return interaction.followUp(response)
    }

    // Uptime
    else if (sub === 'uptime') {
      return interaction.followUp(
        mina.sayf('botInfo.uptime.result', {
          uptime: timeformat(process.uptime()),
        })
      )
    }

    // Docs
    else if (sub === 'docs') {
      const embed = MinaEmbed.primary()
        .setAuthor({ name: mina.say('botInfo.docs.title') })
        .setThumbnail(interaction.client.user?.displayAvatarURL() ?? '')
        .setDescription(mina.say('botInfo.docs.description'))
        .setFooter({ text: mina.say('botInfo.docs.footer') })

      // Buttons
      const buttonsRow = MinaRows.from(
        MinaButtons.link(
          'https://docs.vikshan.me',
          mina.say('botInfo.docs.button')
        )
      )
      return interaction.followUp({ embeds: [embed], components: [buttonsRow] })
    }

    // Ping
    else if (sub === 'ping') {
      const msg = await interaction.followUp(mina.say('botInfo.ping.checking'))
      return msg.edit(
        mina.sayf('botInfo.ping.result', {
          ping: Math.floor(interaction.client.ws.ping).toString(),
        })
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

        const embed = MinaEmbed.primary()
          .setAuthor({ name: mina.say('botInfo.changelog.title') })
          .setDescription(
            `${latestUpdates}\n\n[**view full changelog**](https://github.com/iamvikshan/amina/blob/main/CHANGELOG.md)`
          )
          .setFooter({
            text: mina.say('botInfo.changelog.footer'),
          })

        return interaction.followUp({ embeds: [embed] })
      } catch (error) {
        Logger.error('Error fetching changelog', error)
        return interaction.followUp(
          mina.sayf('botInfo.changelog.error', {
            url: 'https://github.com/iamvikshan/amina/blob/main/CHANGELOG.md',
          })
        )
      }
    }

    return interaction.followUp(mina.say('botInfo.error.unknownSubcommand'))
  },
}

export default command

function botInvite(client: BotClient) {
  const embed = MinaEmbed.primary()
    .setAuthor({ name: mina.say('botInfo.invite.title') })
    .setThumbnail(client.user?.displayAvatarURL() ?? '')
    .setDescription(mina.say('botInfo.invite.description'))

  // Buttons
  const buttons = []
  buttons.push(
    MinaButtons.link(client.getInvite(), mina.say('botInfo.invite.button'))
  )

  if (config.BOT.SUPPORT_SERVER) {
    buttons.push(
      MinaButtons.link(
        config.BOT.SUPPORT_SERVER,
        mina.say('botInfo.invite.support')
      )
    )
  }
  if (config.BOT.DASHBOARD_URL) {
    const dashboardUrl = config.BOT.DASHBOARD_URL.startsWith('http')
      ? config.BOT.DASHBOARD_URL
      : `https://${config.BOT.DASHBOARD_URL}`

    buttons.push(
      MinaButtons.link(dashboardUrl, mina.say('botInfo.invite.dashboard'))
    )
  }

  const buttonsRow = MinaRows.from(...buttons)
  return { embeds: [embed], components: [buttonsRow] }
}
