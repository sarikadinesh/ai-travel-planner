import mongoose from "mongoose";

let memoryServer;

export async function connectDb(mongoUri) {
  mongoose.set("strictQuery", true);

  if (mongoUri === "memory") {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri());
    console.log("MongoDB memory server started");
    return;
  }

  await mongoose.connect(mongoUri);
}

export function getDbStatus() {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  return states[mongoose.connection.readyState] ?? "unknown";
}
