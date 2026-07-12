"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultAdminSeeder = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("../../models/User");
const error_middleware_1 = require("../../middleware/error.middleware");
const defaultAdminSeeder = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminEmail || !adminPassword) {
            error_middleware_1.logger.error('✗ Failed to create default administrator: Missing environment variables.');
            return;
        }
        const existingAdmin = await User_1.User.findOne({ email: adminEmail });
        const hashedPassword = await bcrypt_1.default.hash(adminPassword, 10);
        const adminData = {
            firstName: process.env.ADMIN_FIRST_NAME || 'System',
            lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
            passwordHash: hashedPassword,
            phone: process.env.ADMIN_PHONE || '9999999999',
            role: User_1.UserRole.ADMIN,
            status: User_1.UserStatus.ACTIVE,
            isEmailVerified: true,
        };
        if (existingAdmin) {
            await User_1.User.updateOne({ email: adminEmail }, { $set: adminData });
            error_middleware_1.logger.info('✓ Default administrator credentials synced with .env');
            return;
        }
        const newAdmin = new User_1.User({
            email: adminEmail,
            ...adminData
        });
        await newAdmin.save();
        error_middleware_1.logger.info('✓ Default administrator created successfully.');
    }
    catch (error) {
        error_middleware_1.logger.error('✗ Failed to create default administrator.', error);
    }
};
exports.defaultAdminSeeder = defaultAdminSeeder;
