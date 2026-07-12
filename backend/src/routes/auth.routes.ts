import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { protect } from '../middleware/auth.middleware';
import { loginRateLimiter, forgotPasswordRateLimiter } from '../middleware/rateLimiter.middleware';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/auth.validator';

const router = Router();

router.post('/signup', validate(signupSchema), AuthController.signup);
router.post('/login', loginRateLimiter, validate(loginSchema), AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh', AuthController.refresh);
router.post('/forgot-password', forgotPasswordRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.get('/verify-reset-token', AuthController.verifyResetToken);
router.post('/reset-password/:resetToken', validate(resetPasswordSchema), AuthController.resetPassword);
router.get('/me', protect, AuthController.getMe);

export default router;
