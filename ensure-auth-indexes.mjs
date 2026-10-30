import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");

const client = new MongoClient(uri);
try {
  const db = client.db(process.env.MONGODB_AUTH_DB || "test");
  for (const [collection, field] of [
    ["user", "email"],
    ["account", "userId"],
    ["session", "userId"],
    ["session", "token"],
    ["verification", "identifier"],
  ]) {
    await db.collection(collection).createIndex({ [field]: 1 });
    console.log(`${collection}.${field} index ready`);
  }
} finally {
  await client.close();
}
