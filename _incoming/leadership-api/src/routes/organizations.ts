import { Router } from 'express';
import * as ctrl from '../controllers/organizationController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/',                          ctrl.listOrganizations);
router.post('/',                         ctrl.createOrganization);
router.get('/:id',                       ctrl.getOrganization);
router.put('/:id',                       ctrl.updateOrganization);
router.get('/:id/members',               ctrl.getOrgMembers);
router.post('/:id/members',              ctrl.assignUserToOrg);

export default router;
