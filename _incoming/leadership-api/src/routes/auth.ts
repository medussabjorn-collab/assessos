import { Router } from 'express';
import * as ctrl from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register',         ctrl.register);
router.post('/login',            ctrl.login);
router.post('/refresh',          ctrl.refreshToken);
router.post('/logout',           authenticate, ctrl.logout);
router.get('/me',                authenticate, ctrl.me);
router.put('/me',                authenticate, ctrl.updateMe);
router.put('/change-password',   authenticate, ctrl.changePassword);

// Email verification
router.get('/verify-email',      ctrl.verifyEmail);

// Password reset
router.post('/forgot-password',  ctrl.forgotPassword);
router.post('/reset-password',   ctrl.resetPassword);

// Invitations (admin only)
router.post('/invite',           authenticate, ctrl.inviteUser);
router.post('/accept-invite',    ctrl.acceptInvite);

export default router;
