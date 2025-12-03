import { MinaEmbed } from '@structures/embeds/MinaEmbed'

export async function addTopic(data: any, topic: string): Promise<string> {
  if (!topic)
    return 'oopsie! you forgot to tell me which topic to add. try again, pretty please?'

  const lowercaseTopic = topic.toLowerCase()

  // check if topic already exists
  if (
    data.settings.ticket.topics.find(
      (t: any) => t.name.toLowerCase() === lowercaseTopic
    )
  ) {
    return `uh-oh! the topic \`${topic}\` is already on our list. no need to add it again, silly!`
  }

  data.settings.ticket.topics.push({
    name: topic,
  })
  await data.settings.save()

  return `yay! i've added the topic \`${topic}\` to our awesome list!`
}

export async function removeTopic(data: any, topic: string): Promise<string> {
  if (!topic)
    return 'oopsie! you forgot to tell me which topic to remove. try again, pretty please?'

  const lowercaseTopic = topic.toLowerCase()

  const topics = data.settings.ticket.topics
  // check if topic exists
  if (!topics.find((t: any) => t.name.toLowerCase() === lowercaseTopic)) {
    return `hmm... i couldn't find the topic \`${topic}\`. are you sure it's on our list?`
  }

  data.settings.ticket.topics = topics.filter(
    (t: any) => t.name.toLowerCase() !== lowercaseTopic
  )
  await data.settings.save()

  return `all done! i've removed the topic \`${topic}\` from our list.`
}

export function listTopics(data: any) {
  const topics = data.settings.ticket.topics

  const embed = MinaEmbed.primary()
    .setAuthor({ name: 'ticket topics' })
    .setFooter({
      text: 'thank you for having me!',
    })

  if (topics.length === 0) {
    embed.setDescription(
      "oh no! we don't have any ticket topics yet. " +
        "let's add some to make our ticketing system super awesome!\n\n" +
        'use `/ticket topic add` to add new topics.'
    )
    return { embeds: [embed] }
  }

  const topicNames = topics.map((t: any) => t.name).join(', ')
  embed.addFields({
    name: `topics:`,
    value: topicNames,
  })

  embed.setDescription(
    'here are all our current ticket topics!\n' +
      'remember, you can always add more or remove them as needed.\n\n' +
      'to add a new topic, use `/ticket topic add`.\n' +
      'to remove a topic, use `/ticket topic remove`.'
  )

  return { embeds: [embed] }
}

export default 0
