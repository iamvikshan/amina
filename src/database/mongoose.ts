import mongoose from 'mongoose'
import * as Dev from '@schemas/Dev'
import * as Giveaways from '@schemas/Giveaways'
import Guild from '@schemas/Guild'
import * as Member from '@schemas/Member'
import { model as ModLog } from '@schemas/ModLog'
import { model as ReactionRoles } from '@schemas/ReactionRoles'
import * as TruthOrDare from '@schemas/TruthOrDare'
import User from '@schemas/User'
import { success, error } from '@helpers/Logger'
import { secret } from '@src/config'

mongoose.set('strictQuery', true)

export async function initializeMongoose(): Promise<
  typeof mongoose.connection
> {
  try {
    await mongoose.connect(secret.MONGO_CONNECTION)

    success('Database connection established')

    return mongoose.connection
  } catch (err) {
    error('Mongoose: Failed to connect to database', err)
    process.exit(1)
  }
}

export async function disconnectMongoose(): Promise<void> {
  if ([0, 3].includes(mongoose.connection.readyState)) return

  await mongoose.disconnect()
  success('Mongoose disconnected')
}

export const schemas = {
  Giveaways,
  Guild,
  Member,
  ReactionRoles,
  ModLog,
  User,
  TruthOrDare,
  Dev,
}
