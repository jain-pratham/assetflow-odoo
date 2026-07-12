import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

export class SocketService {
  private static io: Server;
  
  // Keep track of active users mapping userId -> socketId
  private static userSockets = new Map<string, string>();

  static init(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    });

    this.io.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));
        
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        socket.data.userId = decoded._id || decoded.id;
        next();
      } catch (err) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
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

  static getIO(): Server {
    if (!this.io) {
      throw new Error('Socket.io not initialized');
    }
    return this.io;
  }

  static emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(userId).emit(event, data);
    }
  }
}
