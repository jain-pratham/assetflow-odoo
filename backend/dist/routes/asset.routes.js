"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asset_controller_1 = require("../controllers/asset.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Protect all routes
router.use(auth_middleware_1.protect);
// Shared READ routes (ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE)
router.get('/', asset_controller_1.AssetController.getAssets);
router.get('/stats', asset_controller_1.AssetController.getAssetStats);
router.get('/:id', asset_controller_1.AssetController.getAssetById);
// Restricted WRITE routes (ADMIN, ASSET_MANAGER)
router.use((0, auth_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER));
router.post('/', asset_controller_1.AssetController.createAsset);
router.put('/:id', asset_controller_1.AssetController.updateAsset);
router.patch('/:id/status', asset_controller_1.AssetController.toggleAssetStatus);
exports.default = router;
