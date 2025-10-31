import { GiveawaysManager } from 'discord-giveaways'
import { model as Model } from '@schemas/Giveaways'

class MongooseGiveaways extends GiveawaysManager {
  /**
   * @param {BotClient} client
   */
  constructor(client: any) {
    super(
      client,
      {
        default: {
          botsCanWin: false,
          embedColor: client.config.GIVEAWAYS.START_EMBED,
          embedColorEnd: client.config.GIVEAWAYS.END_EMBED,
          reaction: client.config.GIVEAWAYS.REACTION,
        },
      },
      false // do not initialize manager yet
    )
  }

  async getAllGiveaways(): Promise<any[]> {
    return await Model.find().lean().exec()
  }

  async saveGiveaway(messageId: string, giveawayData: any): Promise<boolean> {
    await Model.create(giveawayData)
    return true
  }

  async editGiveaway(messageId: string, giveawayData: any): Promise<boolean> {
    await Model.updateOne({ messageId }, giveawayData).exec()
    return true
  }

  async deleteGiveaway(messageId: string): Promise<boolean> {
    await Model.deleteOne({ messageId }).exec()
    return true
  }
}

export default (client: any) => new MongooseGiveaways(client)

