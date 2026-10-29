import "server-only";

import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");

const globalMongo = globalThis as typeof globalThis & { keepTextMongo?: MongoClient };
export const mongoClient = globalMongo.keepTextMongo ?? new MongoClient(uri);
if (process.env.NODE_ENV !== "production") globalMongo.keepTextMongo = mongoClient;

export const db = mongoClient.db(process.env.MONGODB_AUTH_DB || "test");
