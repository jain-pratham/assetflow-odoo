import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import departmentRoutes from './routes/department.routes';
import categoryRoutes from './routes/category.routes';
import assetRoutes from './routes/asset.routes';
import allocationRoutes from './routes/allocation.routes';
import bookingRoutes from './routes/booking.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import auditRoutes from './routes/audit.routes';
import reportsRoutes from './routes/reports.routes';
import notificationsRoutes from './routes/notifications.routes';
import dashboardRoutes from './routes/dashboard.routes';
import activityRoutes from './routes/activity.routes';
import profileRoutes from './routes/profile.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import path from 'path';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve public directory for uploads (avatars)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/profile', profileRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
