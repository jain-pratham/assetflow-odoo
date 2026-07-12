import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/unread-count', NotificationController.getUnreadCount);
router.get('/latest', NotificationController.getLatest);
router.get('/preferences', NotificationController.getPreferences);
router.post('/preferences', NotificationController.updatePreferences);

router.patch('/read-all', NotificationController.markAllAsRead);
router.patch('/:id/read', NotificationController.markAsRead);

router.delete('/bulk', NotificationController.bulkDelete);
router.delete('/:id', NotificationController.deleteNotification);

router.get('/', NotificationController.getNotifications);

export default router;
