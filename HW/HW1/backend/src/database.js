import mongoose from 'mongoose';

const localUri = 'mongodb://127.0.0.1:27017/lab04_hw1';

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in backend/.env');
  if (process.env.MONGODB_URI !== localUri) throw new Error(`MONGODB_URI must target ${localUri}`);

  await mongoose.connect(process.env.MONGODB_URI);
}
