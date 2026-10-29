import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required");

const client = new MongoClient(uri);
try {
  const db = client.db(process.env.MONGODB_AUTH_DB || "test");
  const collection = await db.listCollections({ name: "notes" }).next();
  const validator = collection?.options?.validator;
  const schema = validator?.$jsonSchema;
  if (!schema?.properties) throw new Error("The notes collection validator was not found");

  await db.command({
    collMod: "notes",
    validator: {
      ...validator,
      $jsonSchema: {
        ...schema,
        properties: {
          ...schema.properties,
          pinned: { bsonType: "bool" },
          customTitle: { bsonType: "bool" },
        },
      },
    },
  });
  process.stdout.write("Notes validator updated for pinned and customTitle.\n");
} finally {
  await client.close();
}
