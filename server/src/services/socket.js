import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/tokens.js';
import { env } from '../config/env.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
        return callback(new Error('Origin not allowed by socket CORS'));
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token) return next(new Error('Missing auth token'));
      const payload = verifyAccessToken(token);
      socket.data.user = { id: payload.sub, role: payload.role };
      return next();
    } catch {
      return next(new Error('Invalid auth token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.data.user;
    socket.join(`user:${id}`);
    if (role === 'admin') socket.join('admins');
    socket.emit('connected', { message: 'Realtime tracking connected', at: new Date().toISOString() });

    socket.on('order:subscribe', (orderId) => {
      if (typeof orderId === 'string' && /^[a-f0-9]{24}$/i.test(orderId)) {
        socket.join(`order:${orderId}`);
      }
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToAdmins(event, payload) {
  io?.to('admins').emit(event, payload);
}

export function emitToOrder(orderId, event, payload) {
  io?.to(`order:${orderId}`).emit(event, payload);
}
