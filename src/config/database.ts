import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
    
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
};