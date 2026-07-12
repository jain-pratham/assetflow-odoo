"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const error_middleware_1 = require("./middleware/error.middleware");
const defaultAdminSeeder_1 = require("./config/seeders/defaultAdminSeeder");
const PORT = process.env.PORT || 5000;
(0, db_1.connectDB)().then(async () => {
    await (0, defaultAdminSeeder_1.defaultAdminSeeder)();
    app_1.default.listen(PORT, () => {
        error_middleware_1.logger.info(`Server running on port ${PORT}`);
    });
});
