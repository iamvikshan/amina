import { automodHandler, statsHandler } from '@src/handlers'
import { EMBED_COLORS } from '@src/config'
import { getSettings } from '@schemas/Guild'
import { getUser, removeAfk } from '@schemas/User'
import { EmbedBuilder, Message } from 'discord.js'
import type { BotClient } from '@src/structures'
import { aiResponderService } from '@src/services/aiResponder'

/**
 * Fetches pronouns for a user from PronounsDB API v2
 * @param {string} userId Discord user ID
 * @returns {Promise<string>} Returns pronouns in subject/object format
 */
async function fetchPronouns(userId: string): Promise<string> {
  try {
    const response = await fetch(
      `https://pronoundb.org/api/v2/lookup?platform=discord&ids=${userId}`
    )
    if (!response.ok) return 'they/them'

    const data: any = await response.json()
    const userPronouns = data[userId]?.sets?.en?.[0]

    // Map the v2 API single pronouns to subject/object pairs
    const pronounsMap: Record<string, string> = {
      he: 'he/him',
      she: 'she/her',
      they: 'they/them',
      it: 'it/its',
      any: 'they/them', // Default to neutral for "any"
      ask: 'they/them', // Default to neutral for "ask"
      avoid: 'they/them', // Default to neutral for "avoid"
    }

    return pronounsMap[userPronouns] || 'they/them'
  } catch (error) {
    console.error('Error fetching pronouns:', error)
    return 'they/them' // Fallback to gender-neutral pronouns
  }
}

/**
 * Gets the appropriate verb conjugation based on pronouns
 * @param {string} subject The subject pronoun
 * @returns {string} Returns 're for "they", 's for others
 */
function getVerbConjugation(subject: string): string {
  return subject === 'they' ? "'re" : "'s"
}

/**
 * Generates a pronoun-aware AFK message
 * @param {Object} params Parameters for generating message
 * @returns {string} Formatted AFK message
 */
function generateAfkMessage(params: {
  pronouns: string
  minutes?: number
}): string {
  const { pronouns, minutes = 0 } = params
  const [subject, object] = pronouns.split('/')

  // Capitalize first letter of subject pronoun
  const Subject = subject.charAt(0).toUpperCase() + subject.slice(1)
  const verb = getVerbConjugation(subject)

  const timeBasedIntros: Record<string, string[]> = {
    short: [
      `*whispers* ${Subject} just left! The trail is still warm!`,
      `*tiptoes in* Psst! ${Subject} stepped away moments ago!`,
    ],
    medium: [
      `*dramatic gasp* ${Subject}${verb} been missing for a bit!`,
      `*spins around* Oh! ${Subject}${verb} been gone for some time!`,
    ],
    long: [
      `*spins around* ${Subject}${verb} been gone for like... forever!`,
      `*bounces worriedly* ${Subject}${verb} been away for quite a while!`,
    ],
    veryLong: [
      `*falls over* ${Subject}${verb} been gone for AGES!`,
      `*dramatically faints* We've been waiting for ${object} for so long!`,
    ],
  }

  let category: string
  if (minutes < 5) category = 'short'
  else if (minutes < 30) category = 'medium'
  else if (minutes < 60) category = 'long'
  else category = 'veryLong'

  const intros = timeBasedIntros[category]
  return intros[Math.floor(Math.random() * intros.length)]
}

/**
 * Handles message creation events
 * @param {BotClient} client - The bot client instance
 * @param {Message} message - The message that was created
 */
export default async (client: BotClient, message: Message): Promise<void> => {
  // AI Responder - check eligibility first (works for DMs and guilds)
  const aiMode = await aiResponderService.shouldRespond(message)
  if (aiMode) {
    await aiResponderService.handleMessage(message, aiMode)
    return // Exit early after AI response (prevents duplicate mention handling)
  }

  // Guild-only features below
  if (!message.guild || message.author.bot) return
  const settings = await getSettings(message.guild)

  // Check if message author is AFK and remove their AFK status
  const authorData: any = await getUser(message.author)
  if (authorData.afk?.enabled) {
    const authorPronouns = await fetchPronouns(message.author.id)
    const [subject] = authorPronouns.split('/')
    const Subject = subject.charAt(0).toUpperCase() + subject.slice(1)
    const verb = getVerbConjugation(subject)

    await removeAfk(message.author.id)
    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.SUCCESS)
      .setDescription(
        `*Bounces excitedly* Welcome back ${message.author.toString()}! 🌟\n` +
          `${Subject}${verb} faster than a shooting star! ✨`
      )
    const response: any = await (message.channel as any).send({
      embeds: [embed],
    })
    setTimeout(() => response.delete().catch(() => {}), 5000)
  }

  // Check for mentioned users who are AFK
  if (message.mentions.users.size > 0) {
    const mentions = [...message.mentions.users.values()]
    const afkMentions: any[] = []

    for (const mentionedUser of mentions) {
      if (mentionedUser.id === message.author.id) continue

      const userData: any = await getUser(mentionedUser)
      if (userData.afk?.enabled) {
        const userPronouns = await fetchPronouns(mentionedUser.id)
        const minutes = userData.afk.since
          ? Math.round((Date.now() - userData.afk.since.getTime()) / 1000 / 60)
          : 0

        const statusIntro = generateAfkMessage({
          pronouns: userPronouns,
          minutes,
        })

        let timePassed = ''
        if (userData.afk.since) {
          timePassed = `\n⏰ Been gone for: ${minutes} minutes *gasp*`
        }

        let endTime = ''
        if (userData.afk.endTime && userData.afk.endTime > new Date()) {
          const minutesLeft = Math.round(
            (userData.afk.endTime.getTime() - new Date().getTime()) / 1000 / 60
          )
          const [subject] = userPronouns.split('/')
          const verb = getVerbConjugation(subject)
          endTime = `\n⌛ ${subject} should be back in: ${minutesLeft} minutes (unless ${subject}${verb} lost in a parallel dimension~)`
        }

        afkMentions.push({
          user: mentionedUser.toString(),
          intro: statusIntro,
          reason:
            userData.afk.reason || '*shrugs mysteriously* No reason given!',
          timePassed,
          endTime,
        })
      }
    }

    if (afkMentions.length > 0) {
      const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.ERROR)
        .setTitle('🌟 AFK Alert! 🌟')
        .setDescription(
          afkMentions
            .map(
              (mention: any) =>
                `${mention.intro}\n${mention.user} is away: ${mention.reason}${mention.timePassed}${mention.endTime}`
            )
            .join('\n\n')
        )

      const response: any = await (message.channel as any).send({
        embeds: [embed],
      })
      setTimeout(() => response.delete().catch(() => {}), 10000)
    }
  }

  // Amina mentions handling (only if AI is not configured/responding)
  if (
    message.content.includes(`${client.user?.id}`) ||
    message.mentions.has(client.user!)
  ) {
    // Check if AI is enabled and configured for this guild
    const aiEnabled = settings.aiResponder?.enabled
    const hasFreeWillChannels =
      (settings.aiResponder?.freeWillChannels?.length || 0) > 0
    const mentionOnly = settings.aiResponder?.mentionOnly !== false // Default to true

    // Only show this message if AI is not set up or not responding
    if (!aiEnabled || (!hasFreeWillChannels && mentionOnly)) {
      const helpMessage = aiEnabled
        ? '💡 **Mina AI is enabled, but not configured for this channel!**\n\n' +
          'To chat with me:\n' +
          '• Ask a server admin to set up a free-will channel using `/admin` → Mina AI\n' +
          '• Or they can enable mention-only mode so I respond when @mentioned\n' +
          '• You can also DM me anytime! Just send a message in DMs.\n\n' +
          'Want to see all my commands? Try `/help`! ✨'
        : '💡 **Hi there!** 👋\n\n' +
          "Mina AI isn't enabled in this server yet. To chat with me:\n" +
          '• Ask a server admin to enable it using `/admin` → Mina AI\n' +
          '• Or you can DM me directly! Just send a message in DMs.\n\n' +
          'Want to see all my commands? Try `/help`! ✨'

      // Send as reply (auto-deletes after 10 seconds to keep channels clean)
      const reply = await message.reply(helpMessage).catch(() => null)
      if (reply) {
        setTimeout(() => reply.delete().catch(() => {}), 10000)
      }
    }
  }

  // Stats handling
  if (settings.stats.enabled) {
    await statsHandler.trackMessageStats(message, false, settings)
  }

  // Automod handling
  await automodHandler.performAutomod(message, settings)
}
