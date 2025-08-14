import { MongoClient } from "mongodb";

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI not defined in environment");
}

const uri = process.env.MONGO_URI;
let cachedClient: MongoClient | null = null;

export async function connectToMongo() {
  if (cachedClient) return cachedClient;

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}
