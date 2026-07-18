import { GiveawaysManager } from 'discord-giveaways'
import { model as Model } from '@schemas/Giveaways'
import { mina } from '@helpers/mina'

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
          ...(mina.featureColors.giveaway !== undefined && {
            embedColor: mina.featureColors.giveaway,
          }),
          ...(mina.featureColors.giveawayEnd !== undefined && {
            embedColorEnd: mina.featureColors.giveawayEnd,
          }),
          reaction: client.config.GIVEAWAYS.REACTION,
        },
      },
      false, // do not initialize manager yet
    )
  }

  override async getAllGiveaways(): Promise<any[]> {
    return await Model.find().lean().exec()
  }

  override async saveGiveaway(
    _messageId: string,
    giveawayData: any,
  ): Promise<boolean> {
    await Model.create(giveawayData)
    return true
  }

  override async editGiveaway(
    messageId: string,
    giveawayData: any,
  ): Promise<boolean> {
    await Model.updateOne({ messageId }, giveawayData).exec()
    return true
  }

  override async deleteGiveaway(messageId: string): Promise<boolean> {
    await Model.deleteOne({ messageId }).exec()
    return true
  }
}

export default (client: any) => new MongooseGiveaways(client)
