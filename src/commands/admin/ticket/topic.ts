import { EmbedBuilder } from 'discord.js'
import { EMBED_COLORS } from '@src/config'

export async function addTopic(data: any, topic: string): Promise<string> {
  if (!topic)
    return 'Oopsie! 🙈 You forgot to tell me which topic to add. Try again, pretty please?'

  const lowercaseTopic = topic.toLowerCase()

  // check if topic already exists
  if (
    data.settings.ticket.topics.find(
      (t: any) => t.name.toLowerCase() === lowercaseTopic
    )
  ) {
    return `Uh-oh! 😅 The topic \`${topic}\` is already on our list. No need to add it again, silly!`
  }

  data.settings.ticket.topics.push({
    name: topic,
  })
  await data.settings.save()

  return `Yay! 🎉 I've added the topic \`${topic}\` to our awesome list!`
}

export async function removeTopic(data: any, topic: string): Promise<string> {
  if (!topic)
    return 'Oopsie! 🙈 You forgot to tell me which topic to remove. Try again, pretty please?'

  const lowercaseTopic = topic.toLowerCase()

  const topics = data.settings.ticket.topics
  // check if topic exists
  if (!topics.find((t: any) => t.name.toLowerCase() === lowercaseTopic)) {
    return `Hmm... 🤔 I couldn't find the topic \`${topic}\`. Are you sure it's on our list?`
  }

  data.settings.ticket.topics = topics.filter(
    (t: any) => t.name.toLowerCase() !== lowercaseTopic
  )
  await data.settings.save()

  return `All done! 👋 I've removed the topic \`${topic}\` from our list.`
}

export function listTopics(data: any): { embeds: EmbedBuilder[] } {
  const topics = data.settings.ticket.topics

  const embed = new EmbedBuilder()
    .setAuthor({ name: '🌟 Ticket Topics' })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setFooter({
      text: 'Thank you for having me! 💕',
    })

  if (topics.length === 0) {
    embed.setDescription(
      "Oh no! 😮 We don't have any ticket topics yet. " +
        "Let's add some to make our ticketing system super awesome! 💖\n\n" +
        'Use `/ticket topic add` to add new topics.'
    )
    return { embeds: [embed] }
  }

  const topicNames = topics.map((t: any) => t.name).join(', ')
  embed.addFields({
    name: `📂 **Topics:**`,
    value: topicNames,
  })

  embed.setDescription(
    'Here are all our current ticket topics! 🎉\n' +
      'Remember, you can always add more or remove them as needed.\n\n' +
      'To add a new topic, use `/ticket topic add`.\n' +
      'To remove a topic, use `/ticket topic remove`.'
  )

  return { embeds: [embed] }
}

export default 0
