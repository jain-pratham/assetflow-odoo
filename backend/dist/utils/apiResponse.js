"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (message, data, pagination) => {
    return {
        success: true,
        message,
        data,
        ...(pagination && { pagination })
    };
};
exports.successResponse = successResponse;
const errorResponse = (message, error) => {
    return {
        success: false,
        message,
        error,
    };
};
exports.errorResponse = errorResponse;
