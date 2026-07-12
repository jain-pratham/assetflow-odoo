"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const allocation_controller_1 = require("../controllers/allocation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Protect all routes
router.use(auth_middleware_1.protect);
// Shared READ routes (ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE)
router.get('/', allocation_controller_1.AllocationController.getAllocations);
router.get('/stats', allocation_controller_1.AllocationController.getAllocationStats);
router.get('/history', allocation_controller_1.AllocationController.getHistory);
// Restricted WRITE routes (ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD)
// EMPLOYEE cannot allocate, transfer, or return.
router.use((0, auth_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER, User_1.UserRole.DEPARTMENT_HEAD));
router.post('/', allocation_controller_1.AllocationController.allocateAsset);
router.put('/:id/transfer', allocation_controller_1.AllocationController.transferAsset);
router.put('/:id/return', allocation_controller_1.AllocationController.returnAsset);
exports.default = router;
