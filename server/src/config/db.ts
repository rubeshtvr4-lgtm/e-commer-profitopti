import mongoose from 'mongoose';
import { ENV } from './env.js';

let memoryServer: any = null;

export async function connectDB(): Promise<typeof mongoose> {
  let uri = ENV.MONGODB_URI;

  if (!uri) {
    console.log('⚡ No MONGODB_URI provided. Initializing in-memory MongoDB instance for local development...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      console.log(`✅ In-memory MongoDB started at: ${uri}`);
    } catch (err) {
      console.error('Failed to initialize in-memory MongoDB:', err);
      throw new Error('No MongoDB URI configured and in-memory fallback failed.');
    }
  }

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true,
    });
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // If remote connection failed in development, try fallback
    if (ENV.NODE_ENV === 'development' && !memoryServer) {
      console.log('⚡ Attempting fallback to in-memory MongoDB for development session...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        uri = memoryServer.getUri();
        const conn = await mongoose.connect(uri);
        console.log(`✅ Fallback in-memory MongoDB connected: ${conn.connection.host}`);
        return conn;
      } catch (fallbackErr) {
        console.error('Fallback failed:', fallbackErr);
      }
    }
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
