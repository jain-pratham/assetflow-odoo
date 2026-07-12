"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Protect all user routes and restrict them to ADMIN only
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.authorize)(User_1.UserRole.ADMIN));
router.get('/', user_controller_1.UserController.getUsers);
router.get('/:id', user_controller_1.UserController.getUserById);
router.put('/:id', user_controller_1.UserController.updateUser);
router.patch('/:id/status', user_controller_1.UserController.updateUserStatus);
exports.default = router;
