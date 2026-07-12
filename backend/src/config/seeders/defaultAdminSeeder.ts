import bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../../models/User';
import { logger } from '../../middleware/error.middleware';

export const defaultAdminSeeder = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      logger.error('✗ Failed to create default administrator: Missing environment variables.');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminData = {
      firstName: process.env.ADMIN_FIRST_NAME || 'System',
      lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
      passwordHash: hashedPassword,
      phone: process.env.ADMIN_PHONE || '9999999999',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
    };

    if (existingAdmin) {
      await User.updateOne({ email: adminEmail }, { $set: adminData });
      logger.info('✓ Default administrator credentials synced with .env');
      return;
    }

    const newAdmin = new User({
      email: adminEmail,
      ...adminData
    });

    await newAdmin.save();
    logger.info('✓ Default administrator created successfully.');
  } catch (error) {
    logger.error('✗ Failed to create default administrator.', error);
  }
};
