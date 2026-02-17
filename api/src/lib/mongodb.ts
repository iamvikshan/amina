/**
 * MongoDB Client for Cloudflare Workers
 *
 * Uses the official MongoDB driver which is now supported on Cloudflare Workers
 * thanks to the addition of node:dns, node:tls, node:net, and node:crypto support.
 *
 * @see https://blog.cloudflare.com/full-stack-development-on-cloudflare-workers/
 *
 * NOTE: MongoDB Atlas Data API was deprecated and will be removed September 30, 2025
 * @see https://www.mongodb.com/docs/atlas/app-services/data-api/data-api-deprecation/
 */

import { MongoClient, Db, Collection, Document, ObjectId } from 'mongodb';
import { MongoDBConfig } from '../../types/database';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Get a MongoDB client instance (cached for connection reuse)
 */
export async function getMongoClient(
  config: MongoDBConfig
): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(config.connectionString, {
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  cachedClient = client;
  return client;
}

/**
 * Get a MongoDB database instance
 */
export async function getDatabase(config: MongoDBConfig): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await getMongoClient(config);
  cachedDb = client.db(config.database);
  return cachedDb;
}

/**
 * Get a MongoDB collection
 */
export async function getCollection<T extends Document>(
  config: MongoDBConfig,
  collectionName: string
): Promise<Collection<T>> {
  const db = await getDatabase(config);
  return db.collection<T>(collectionName);
}

/**
 * MongoDB helper class for easier usage in routes
 */
export class MongoDB {
  private config: MongoDBConfig;

  constructor(connectionString: string, database: string) {
    this.config = { connectionString, database };
  }

  async collection<T extends Document>(name: string): Promise<Collection<T>> {
    return getCollection<T>(this.config, name);
  }

  async findOne<T extends Document>(
    collectionName: string,
    filter: Record<string, unknown>,
    options?: { projection?: Record<string, 0 | 1> }
  ): Promise<T | null> {
    const collection = await this.collection<T>(collectionName);
    return collection.findOne(
      filter as any,
      options as any
    ) as Promise<T | null>;
  }

  async find<T extends Document>(
    collectionName: string,
    filter: Record<string, unknown>,
    options?: {
      limit?: number;
      skip?: number;
      sort?: Record<string, 1 | -1>;
      projection?: Record<string, 0 | 1>;
    }
  ): Promise<T[]> {
    const collection = await this.collection<T>(collectionName);
    let cursor = collection.find(
      filter as any,
      { projection: options?.projection } as any
    );

    if (options?.sort) {
      cursor = cursor.sort(options.sort);
    }
    if (options?.skip) {
      cursor = cursor.skip(options.skip);
    }
    if (options?.limit) {
      cursor = cursor.limit(options.limit);
    }

    return cursor.toArray() as Promise<T[]>;
  }

  async insertOne<T extends Document>(
    collectionName: string,
    document: T
  ): Promise<{ insertedId: ObjectId }> {
    const collection = await this.collection<T>(collectionName);
    const result = await collection.insertOne(document as any);
    return { insertedId: result.insertedId };
  }

  async updateOne(
    collectionName: string,
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    options?: { upsert?: boolean }
  ): Promise<{
    matchedCount: number;
    modifiedCount: number;
    upsertedCount: number;
  }> {
    const collection = await this.collection(collectionName);
    // If update already has operators like $set, $push, use as-is, otherwise wrap in $set
    const hasOperators = Object.keys(update).some((key) => key.startsWith('$'));
    const updateDoc = hasOperators ? update : { $set: update };
    const result = await collection.updateOne(
      filter as any,
      updateDoc as any,
      options
    );
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    };
  }

  async deleteOne(
    collectionName: string,
    filter: Record<string, unknown>
  ): Promise<{ deletedCount: number }> {
    const collection = await this.collection(collectionName);
    const result = await collection.deleteOne(filter as any);
    return { deletedCount: result.deletedCount };
  }

  async aggregate<T extends Document>(
    collectionName: string,
    pipeline: Record<string, unknown>[]
  ): Promise<T[]> {
    const collection = await this.collection<T>(collectionName);
    return collection.aggregate(pipeline as any).toArray() as Promise<T[]>;
  }
}

/**
 * Create a MongoDB instance from environment variables
 * Extracts database name from the connection string if present
 */
export function createMongoClient(env: {
  MONGO_CONNECTION?: string;
}): MongoDB | null {
  if (!env.MONGO_CONNECTION) {
    console.warn('MONGO_CONNECTION not configured');
    return null;
  }

  // Extract database name from URI path (e.g., mongodb+srv://...mongodb.net/amina?...)
  const dbMatch = env.MONGO_CONNECTION.match(
    /mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/
  );
  const database = dbMatch?.[1] || 'amina';

  return new MongoDB(env.MONGO_CONNECTION, database);
}

// Re-export ObjectId for convenience
export { ObjectId } from 'mongodb';
