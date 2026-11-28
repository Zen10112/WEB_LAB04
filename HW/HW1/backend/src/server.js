import { once } from 'node:events';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDatabase } from './database.js';

try {
  const app = createApp({ frontendOrigin: process.env.FRONTEND_ORIGIN });
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');

  await connectDatabase();
  const server = app.listen(port, '127.0.0.1');
  await once(server, 'listening');
  console.log(`HW1 backend listening on http://127.0.0.1:${port}`);
} catch (error) {
  console.error('HW1 startup failed:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
}
