"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = require("../controllers/audit.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// READ — all roles (controller enforces scoping)
router.get('/stats', audit_controller_1.AuditController.getStats);
router.get('/history', audit_controller_1.AuditController.getHistory);
router.get('/discrepancies', audit_controller_1.AuditController.getDiscrepancies);
router.get('/:id', audit_controller_1.AuditController.getById);
router.get('/', audit_controller_1.AuditController.getAudits);
// WRITE — ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD
router.use((0, auth_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER, User_1.UserRole.DEPARTMENT_HEAD));
router.post('/', audit_controller_1.AuditController.createAudit);
router.put('/:id/start', audit_controller_1.AuditController.startAudit);
router.put('/:id/verify', audit_controller_1.AuditController.verifyAsset);
// COMPLETE — ADMIN and ASSET_MANAGER only
router.put('/:id/complete', (0, auth_middleware_1.authorize)(User_1.UserRole.ADMIN, User_1.UserRole.ASSET_MANAGER), audit_controller_1.AuditController.completeAudit);
exports.default = router;
