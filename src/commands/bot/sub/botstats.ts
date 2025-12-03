import { config } from '@src/config'
import { timeformat } from '@helpers/Utils'
import { updateBotStats } from '@schemas/Dev'
import os from 'os'
import { stripIndent } from 'common-tags'
import type { BotClient } from '@structures/BotClient'
import { MinaEmbed } from '@structures/embeds/MinaEmbed'
import { MinaButtons, MinaRows } from '@helpers/componentHelper'
import { mina } from '@helpers/mina'

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
  desc += `total guilds: ${guilds}\n`
  desc += `total users: ${users}\n`
  desc += `total channels: ${channels}\n`
  // Use validated websocket ping (default to 0 when not available)
  const wsPing = client.ws.ping > 0 ? client.ws.ping : 0
  desc += `websocket ping: ${wsPing} ms\n`
  desc += '\n'

  const embed = MinaEmbed.primary()
    .setTitle(mina.say('botInfo.stats.title'))
    .setThumbnail(client.user?.displayAvatarURL() ?? '')
    .setDescription(desc)
    .addFields(
      {
        name: mina.say('botInfo.stats.fields.cpu'),
        value: stripIndent`
        ❯ **os:** ${platform} [${architecture}]
        ❯ **cores:** ${cores}
        ❯ **usage:** ${cpuUsage}
        `,
        inline: true,
      },
      {
        name: mina.say('botInfo.stats.fields.botRam'),
        value: stripIndent`
        ❯ **used:** ${botUsed}
        ❯ **available:** ${botAvailable}
        ❯ **usage:** ${botUsage}
        `,
        inline: true,
      },
      {
        name: mina.say('botInfo.stats.fields.overallRam'),
        value: stripIndent`
        ❯ **used:** ${overallUsed}
        ❯ **available:** ${overallAvailable}
        ❯ **usage:** ${overallUsage}
        `,
        inline: true,
      },
      {
        name: mina.say('botInfo.stats.fields.nodeVersion'),
        value: process.versions.node,
        inline: false,
      },
      {
        name: mina.say('botInfo.stats.fields.uptime'),
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
