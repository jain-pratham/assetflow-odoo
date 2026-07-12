import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { logger } from './middleware/error.middleware';
import { defaultAdminSeeder } from './config/seeders/defaultAdminSeeder';

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await defaultAdminSeeder();
  
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
});
