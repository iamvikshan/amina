// @root/app/lib/database/mongoose.ts
import {
  MongoClient,
  type Db,
  type Collection,
  type MongoClientOptions,
  type Document,
  type Filter,
  type UpdateFilter,
} from 'mongodb';
import type {
  IGuild,
  IGuildAutomod,
  IGuildWelcomeFarewell,
  IGuildTicket,
  IGuildLogs,
} from '@types';
import type { IUser, IUserProfile } from '@types';

// Only validate at runtime when actually connecting, not during build
function validateMongoUri(): string {
  const uri = process.env.MONGO_CONNECTION || '';
  if (!uri) {
    throw new Error('Missing MONGO_CONNECTION environment variable');
  }
  return uri;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoConnection: {
    client: MongoClient | null;
    promise: Promise<MongoClient> | null;
  } | null;
}

if (!global.mongoConnection) {
  global.mongoConnection = { client: null, promise: null };
}

async function connectDB(): Promise<MongoClient> {
  if (global.mongoConnection?.client) {
    return global.mongoConnection.client;
  }

  if (!global.mongoConnection?.promise) {
    const uri = validateMongoUri();
    const options: MongoClientOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    global.mongoConnection!.promise = new MongoClient(uri, options)
      .connect()
      .then((client) => {
        console.log('MongoDB connected successfully');
        return client;
      });
  }

  try {
    global.mongoConnection!.client = await global.mongoConnection!.promise;
  } catch (e) {
    global.mongoConnection!.promise = null;
    console.error('MongoDB connection error:', e);
    throw e;
  }

  return global.mongoConnection!.client;
}

async function getDb(): Promise<Db> {
  const client = await connectDB();
  // Use the database specified in MONGO_CONNECTION (or driver's default)
  return client.db();
}

type DbDoc<TShape> = Document & TShape;

async function getCollection<TShape>(
  name: string
): Promise<Collection<DbDoc<TShape>>> {
  const db = await getDb();
  return db.collection<DbDoc<TShape>>(name);
}

type ModelLike<TShape extends { _id: string }> = {
  findById: (id: string) => Promise<TShape | null>;
  findByIdAndUpdate: (
    id: string,
    update: UpdateFilter<DbDoc<TShape>>,
    options?: {
      new?: boolean;
    }
  ) => Promise<TShape | null>;
};

function createModelLike<TShape extends { _id: string }>(
  collectionName: string
): ModelLike<TShape> {
  return {
    async findById(id: string): Promise<TShape | null> {
      const collection = await getCollection<TShape>(collectionName);
      const doc = await collection.findOne({ _id: id } as Filter<
        DbDoc<TShape>
      >);
      return (doc ?? null) as unknown as TShape | null;
    },
    async findByIdAndUpdate(
      id: string,
      update: UpdateFilter<DbDoc<TShape>>
    ): Promise<TShape | null> {
      const collection = await getCollection<TShape>(collectionName);
      const result = await collection.findOneAndUpdate(
        { _id: id } as Filter<DbDoc<TShape>>,
        update,
        { returnDocument: 'after', includeResultMetadata: true }
      );
      return (result.value ?? null) as unknown as TShape | null;
    },
  };
}

// Mongoose used automatic pluralization for model names ('guild' -> 'guilds')
const Guild = createModelLike<IGuild>('guilds');
const User = createModelLike<IUser>('users');

export class UserManager {
  private static instance: UserManager;
  private constructor() {}

  static async getInstance(): Promise<UserManager> {
    if (!UserManager.instance) {
      await connectDB();
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  async getUser(userId: string): Promise<IUser | null> {
    return await User.findById(userId);
  }

  async updateUser(
    userId: string,
    data: Partial<Omit<IUser, '_id'>>
  ): Promise<IUser | null> {
    return await User.findByIdAndUpdate(userId, { $set: data } as any, {
      new: true,
    });
  }

  async updateProfile(
    userId: string,
    profileData: Partial<IUserProfile>
  ): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      userId,
      { $set: { profile: profileData } } as any,
      { new: true }
    );
  }

  async updatePrivacy(
    userId: string,
    privacySettings: Partial<IUserProfile['privacy']>
  ): Promise<IUser | null> {
    const collection = await getCollection<IUser>('users');
    const result = await collection.findOneAndUpdate(
      { _id: userId } as Filter<DbDoc<IUser>>,
      { $set: { 'profile.privacy': privacySettings } } as any,
      { returnDocument: 'after', includeResultMetadata: true }
    );
    return (result.value ?? null) as unknown as IUser | null;
  }

  async togglePremium(
    userId: string,
    enabled: boolean,
    expiresAt?: Date
  ): Promise<IUser | null> {
    const collection = await getCollection<IUser>('users');
    const result = await collection.findOneAndUpdate(
      { _id: userId } as Filter<DbDoc<IUser>>,
      {
        $set: {
          'premium.enabled': enabled,
          'premium.expiresAt': expiresAt || null,
        },
      } as any,
      { returnDocument: 'after', includeResultMetadata: true }
    );
    return (result.value ?? null) as unknown as IUser | null;
  }
}

export class GuildManager {
  private static instance: GuildManager;
  private constructor() {}

  static async getInstance(): Promise<GuildManager> {
    if (!GuildManager.instance) {
      await connectDB();
      GuildManager.instance = new GuildManager();
    }
    return GuildManager.instance;
  }

  async getGuild(guildId: string): Promise<IGuild | null> {
    return await Guild.findById(guildId);
  }

  async updateGuild(
    guildId: string,
    data: Partial<Omit<IGuild, '_id'>>
  ): Promise<IGuild | null> {
    return await Guild.findByIdAndUpdate(guildId, { $set: data } as any, {
      new: true,
    });
  }

  async updateAutomod(
    guildId: string,
    automodSettings: Partial<IGuildAutomod>
  ): Promise<IGuild | null> {
    const currentGuild = await this.getGuild(guildId);
    if (!currentGuild) return null;

    const updatedAutomod = {
      ...currentGuild.automod,
      ...automodSettings,
    };

    return this.updateGuild(guildId, { automod: updatedAutomod });
  }

  async updateWelcome(
    guildId: string,
    welcomeSettings: Partial<IGuildWelcomeFarewell>
  ): Promise<IGuild | null> {
    const currentGuild = await this.getGuild(guildId);
    if (!currentGuild) return null;

    const updatedWelcome = {
      ...currentGuild.welcome,
      ...welcomeSettings,
    };

    return this.updateGuild(guildId, { welcome: updatedWelcome });
  }

  async updateTicket(
    guildId: string,
    ticketSettings: Partial<IGuildTicket>
  ): Promise<IGuild | null> {
    const currentGuild = await this.getGuild(guildId);
    if (!currentGuild) return null;

    const updatedTicket = {
      ...currentGuild.ticket,
      ...ticketSettings,
    };

    return this.updateGuild(guildId, { ticket: updatedTicket });
  }

  async updateLogs(
    guildId: string,
    logsSettings: Partial<IGuildLogs>
  ): Promise<IGuild | null> {
    const currentGuild = await this.getGuild(guildId);
    if (!currentGuild) return null;

    const updatedLogs = {
      ...currentGuild.logs,
      ...logsSettings,
    };

    return this.updateGuild(guildId, { logs: updatedLogs });
  }
}

export { Guild, User, connectDB };
export default { GuildManager, UserManager };
