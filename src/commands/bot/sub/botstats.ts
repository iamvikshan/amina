import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js'
import { EMBED_COLORS, config } from '@src/config'
import { timeformat } from '@helpers/Utils'
import { updateBotStats } from '@schemas/Dev'
import os from 'os'
import { stripIndent } from 'common-tags'
import type { BotClient } from '@structures/BotClient'

export default function botstats(client: BotClient) {
  // STATS
  const guilds = client.guilds.cache.size
  const channels = client.channels.cache.size
  const users = client.guilds.cache.reduce((size, g) => size + g.memberCount, 0)

  // CPU
  const platform = process.platform.replace(/win32/g, 'Windows')
  const architecture = os.arch()
  const cores = os.cpus().length
  const cpuUsage = `${(process.cpuUsage().user / 1024 / 1024).toFixed(2)} MB`

  // RAM
  const botUsed = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
  const botAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`
  const botUsage = `${((process.memoryUsage().heapUsed / os.totalmem()) * 100).toFixed(1)}%`

  const overallUsed = `${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB`
  const overallAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`
  const overallUsage = `${Math.floor(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)}%`

  let desc = ''
  desc += `❒ Total guilds: ${guilds}\n`
  desc += `❒ Total users: ${users}\n`
  desc += `❒ Total channels: ${channels}\n`
  // Use validated websocket ping (default to 0 when not available)
  const wsPing = client.ws.ping > 0 ? client.ws.ping : 0
  desc += `❒ Websocket Ping: ${wsPing} ms\n`
  desc += '\n'

  const embed = new EmbedBuilder()
    .setTitle('Bot Information')
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(desc)
    .addFields(
      {
        name: 'CPU',
        value: stripIndent`
        ❯ **OS:** ${platform} [${architecture}]
        ❯ **Cores:** ${cores}
        ❯ **Usage:** ${cpuUsage}
        `,
        inline: true,
      },
      {
        name: "Bot's RAM",
        value: stripIndent`
        ❯ **Used:** ${botUsed}
        ❯ **Available:** ${botAvailable}
        ❯ **Usage:** ${botUsage}
        `,
        inline: true,
      },
      {
        name: 'Overall RAM',
        value: stripIndent`
        ❯ **Used:** ${overallUsed}
        ❯ **Available:** ${overallAvailable}
        ❯ **Usage:** ${overallUsage}
        `,
        inline: true,
      },
      {
        name: 'Node Js version',
        value: process.versions.node,
        inline: false,
      },
      {
        name: 'Uptime',
        value: '```' + timeformat(process.uptime()) + '```',
        inline: false,
      }
    )

  // Update bot statistics in DB (non-blocking). This helps keep dashboard data fresh
  try {
    const stats = {
      guilds,
      users,
      channels,
      ping: wsPing,
      uptime: process.uptime(),
    }

    updateBotStats(stats)
      .then(() =>
        client.logger.log(
          `Bot stats updated via /bot stats: ${guilds} guilds, ${users} users, ${channels} channels, ${wsPing}ms ping`
        )
      )
      .catch(err =>
        client.logger.error('Failed to update bot stats via /bot stats:', err)
      )
  } catch (err) {
    client.logger.error(
      'Unexpected error updating bot stats via /bot stats:',
      err
    )
  }

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
