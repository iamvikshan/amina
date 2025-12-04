import mongoose from 'mongoose'
import { /*log,*/ success, error } from '../helpers/Logger'
import { secret } from '@src/config'

mongoose.set('strictQuery', true)

export async function initializeMongoose(): Promise<
  typeof mongoose.connection
> {
  // log(`Connecting to MongoDb...`)

  try {
    await mongoose.connect(secret.MONGO_CONNECTION)

    success('Mongoose: Database connection established')

    return mongoose.connection
  } catch (err) {
    error('Mongoose: Failed to connect to database', err)
    process.exit(1)
  }
}

export const schemas = {
  Giveaways: require('./schemas/Giveaways'),
  Guild: require('./schemas/Guild'),
  Member: require('./schemas/Member'),
  ReactionRoles: require('./schemas/ReactionRoles').model,
  ModLog: require('./schemas/ModLog').model,
  User: require('./schemas/User'),
  TruthOrDare: require('./schemas/TruthOrDare').model,
  Dev: require('./schemas/Dev'),
}
