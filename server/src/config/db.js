import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../core/logger/logger.js';

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // ignore
}

export async function connectDB() {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(env.mongoUri, {
      dbName: 'projectify',
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4 to prevent IPv6 DNS hangs on cloud providers
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected - reconnecting...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime error', { error: err.message });
    });
  } catch (error) {
    logger.error('MongoDB connection failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}
