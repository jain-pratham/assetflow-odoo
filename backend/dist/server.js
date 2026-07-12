"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const error_middleware_1 = require("./middleware/error.middleware");
const defaultAdminSeeder_1 = require("./config/seeders/defaultAdminSeeder");
const socket_service_1 = require("./services/socket.service");
const cron_service_1 = require("./services/cron.service");
const PORT = process.env.PORT || 5000;
// Wrap express app
const server = http_1.default.createServer(app_1.default);
// Initialize Socket.io and Cron
socket_service_1.SocketService.init(server);
cron_service_1.CronService.init();
(0, db_1.connectDB)().then(async () => {
    await (0, defaultAdminSeeder_1.defaultAdminSeeder)();
    server.listen(PORT, () => {
        error_middleware_1.logger.info(`Server running on port ${PORT}`);
    });
});
