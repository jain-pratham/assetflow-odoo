import { Router } from 'express';
import { AssetController } from '../controllers/asset.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/User';

const router = Router();

// Protect all routes
router.use(protect);

// Shared READ routes (ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE)
router.get('/', AssetController.getAssets);
router.get('/stats', AssetController.getAssetStats);
router.get('/:id', AssetController.getAssetById);

// Restricted WRITE routes (ADMIN, ASSET_MANAGER)
router.use(authorize(UserRole.ADMIN, UserRole.ASSET_MANAGER));
router.post('/', AssetController.createAsset);
router.put('/:id', AssetController.updateAsset);
router.patch('/:id/status', AssetController.toggleAssetStatus);

export default router;
