import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { logger } from './middleware/error.middleware';
import { defaultAdminSeeder } from './config/seeders/defaultAdminSeeder';
import { SocketService } from './services/socket.service';
import { CronService } from './services/cron.service';

const PORT = process.env.PORT || 5000;

// Wrap express app
const server = http.createServer(app);

// Initialize Socket.io and Cron
SocketService.init(server);
CronService.init();

connectDB().then(async () => {
  await defaultAdminSeeder();
  
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
});
