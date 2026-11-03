import { Db, MongoClient, ObjectId } from 'mongodb';

const uri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/splitwise-app';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (!client) {
    client = new MongoClient(uri);
  }

  if (!db) {
    await client.connect();
    db = client.db();
  }

  return db;
}

export function serializeDoc<T extends { _id?: ObjectId }>(doc: T | null | undefined) {
  if (!doc) return null;

  const { _id, ...rest } = doc as Record<string, unknown>;
  return {
    ...rest,
    id: _id ? _id.toString() : undefined,
  };
}

export function toObjectId(value: string | ObjectId | undefined) {
  if (!value) return undefined;
  if (value instanceof ObjectId) return value;

  try {
    return new ObjectId(value);
  } catch {
    return undefined;
  }
}
