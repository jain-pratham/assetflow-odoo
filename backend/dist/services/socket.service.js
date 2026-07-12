"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class SocketService {
    static io;
    // Keep track of active users mapping userId -> socketId
    static userSockets = new Map();
    static init(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                credentials: true,
            },
        });
        this.io.use((socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token)
                    return next(new Error('Authentication error'));
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
                socket.data.userId = decoded.id;
                next();
            }
            catch (err) {
                next(new Error('Authentication error'));
            }
        });
        this.io.on('connection', (socket) => {
            const userId = socket.data.userId;
            if (userId) {
                // Automatically join a personal room based on their userId
                socket.join(userId);
                this.userSockets.set(userId, socket.id);
            }
            socket.on('disconnect', () => {
                if (userId) {
                    this.userSockets.delete(userId);
                }
            });
        });
    }
    static getIO() {
        if (!this.io) {
            throw new Error('Socket.io not initialized');
        }
        return this.io;
    }
    static emitToUser(userId, event, data) {
        if (this.io) {
            this.io.to(userId).emit(event, data);
        }
    }
}
exports.SocketService = SocketService;
