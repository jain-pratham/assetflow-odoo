"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.logger = void 0;
const apiResponse_1 = require("../utils/apiResponse");
// Minimal logger for now
exports.logger = {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
    error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err || ''),
    warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
};
const errorHandler = (err, req, res, next) => {
    exports.logger.error(`${req.method} ${req.url} - ${err.message}`, err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json((0, apiResponse_1.errorResponse)(message, process.env.NODE_ENV === 'development' ? err.stack : undefined));
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    res.status(404).json((0, apiResponse_1.errorResponse)(`Route not found: ${req.method} ${req.url}`));
};
exports.notFoundHandler = notFoundHandler;
