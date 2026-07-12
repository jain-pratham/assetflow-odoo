"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const apiResponse_1 = require("../utils/apiResponse");
const User_1 = require("../models/User");
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json((0, apiResponse_1.errorResponse)('Not authorized to access this route'));
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET || 'secret');
        const user = await User_1.User.findById(decoded.id);
        if (!user) {
            return res.status(401).json((0, apiResponse_1.errorResponse)('The user belonging to this token does no longer exist.'));
        }
        if (user.status !== 'ACTIVE') {
            return res.status(401).json((0, apiResponse_1.errorResponse)('Your account has been deactivated.'));
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json((0, apiResponse_1.errorResponse)('Not authorized to access this route'));
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json((0, apiResponse_1.errorResponse)(`User role ${req.user?.role} is not authorized to access this route`));
        }
        next();
    };
};
exports.authorize = authorize;
