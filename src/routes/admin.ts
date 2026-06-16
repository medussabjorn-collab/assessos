import { Router } from 'express';
import * as ctrl from '../controllers/adminController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

// Users
router.get('/users',                    ctrl.listUsers);
router.get('/users/:id',                ctrl.getUserById);
router.put('/users/:id',                ctrl.updateUser);
router.delete('/users/:id',             ctrl.deleteUser);

// Assessment Configs
router.get('/configs',                  ctrl.listConfigs);
router.put('/configs/:moduleId',        ctrl.updateConfig);

// Audit Logs
router.get('/audit',                    ctrl.getAuditLogs);

// Platform Stats
router.get('/stats',                    ctrl.getStats);

export default router;
