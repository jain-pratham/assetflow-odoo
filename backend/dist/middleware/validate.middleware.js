"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const apiResponse_1 = require("../utils/apiResponse");
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.errors || error.issues || [];
                const formatted = errors.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                }));
                return res.status(400).json((0, apiResponse_1.errorResponse)('Validation Error', formatted));
            }
            return res.status(400).json((0, apiResponse_1.errorResponse)('Validation Error', error));
        }
    };
};
exports.validate = validate;
