import config from '@src/config'
import { EmbedBuilder, WebhookClient } from 'discord.js'
import pino from 'pino'
import Honeybadger from './Honeybadger'

const webhookLogger = process.env.LOGS_WEBHOOK
  ? new WebhookClient({
      url: process.env.LOGS_WEBHOOK,
    })
  : undefined

const today = new Date()
const pinoLogger = pino(
  {
    level: 'debug',
  },
  pino.multistream([
    {
      level: 'info',
      stream: pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:mm:ss',
          ignore: 'pid,hostname',
          singleLine: false,
          hideObject: true,
          customColors: 'info:blue,warn:yellow,error:red',
        },
      }),
    },
    {
      level: 'debug',
      stream: pino.destination({
        dest: `${process.cwd()}/logs/combined-${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}.log`,
        sync: true,
        mkdir: true,
      }),
    },
  ])
)

function sendWebhook(content?: string, err?: Error | any): void {
  if (!content && !err) return
  const errString = err?.stack || err

  const embed = new EmbedBuilder()
    .setColor(config.EMBED_COLORS.ERROR)
    .setAuthor({ name: err?.name || 'Error' })

  if (errString)
    embed.setDescription(
      '```js\n' +
        (errString.length > 4096
          ? `${errString.substr(0, 4000)}...`
          : errString) +
        '\n```'
    )

  embed.addFields({
    name: 'Description',
    value: content || err?.message || 'NA',
  })
  webhookLogger
    ?.send({
      username: 'Logs',
      embeds: [embed],
    })
    .catch(() => {})
}

export class Logger {
  static success(content: string): void {
    pinoLogger.info(content)
  }

  static log(content: string): void {
    pinoLogger.info(content)
  }

  static warn(content: string): void {
    pinoLogger.warn(content)
  }

  static error(content: string, ex?: Error | any): void {
    if (ex) {
      pinoLogger.error(ex, `${content}: ${ex?.message}`)

      // Report to Honeybadger
      Honeybadger.notify(ex, {
        context: {
          errorLocation: content,
        },
      })
    } else {
      pinoLogger.error(content)

      // Report string errors to Honeybadger as well
      Honeybadger.notify(new Error(content))
    }
    if (webhookLogger) sendWebhook(content, ex)
  }

  static debug(content: string): void {
    pinoLogger.debug(content)
  }
}

// Named exports for convenience
export const { success, log, warn, error, debug } = Logger

// Default export for backwards compatibility
export default Logger
