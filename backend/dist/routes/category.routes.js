"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// Protect all category routes and restrict them to ADMIN only
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.authorize)(User_1.UserRole.ADMIN));
router.get('/', category_controller_1.CategoryController.getCategories);
router.get('/:id', category_controller_1.CategoryController.getCategoryById);
router.post('/', category_controller_1.CategoryController.createCategory);
router.put('/:id', category_controller_1.CategoryController.updateCategory);
router.patch('/:id/status', category_controller_1.CategoryController.toggleCategoryStatus);
exports.default = router;
