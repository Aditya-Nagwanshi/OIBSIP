import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log(`[db] Connected to MongoDB at ${uri.replace(/\/\/[^@]*@/, '//***@')}`);
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
}
