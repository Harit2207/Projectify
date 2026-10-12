import { Server } from 'socket.io';
import { verifyAccessToken } from '../shared/utils/jwt.js';
import { User } from '../features/auth/auth.model.js';
import { logger } from '../core/logger/logger.js';
import { env } from './env.js';

let io;

//attaching socket to express http
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // ── Auth middleware ────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.cookie
          ?.split(';')
          .find((c) => c.trim().startsWith('accessToken='))
          ?.split('=')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);

      const user = await User.findById(decoded.userId).select(
        'name email avatar',
      );

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;

      next();
    } catch (error) {
      logger.warn('Socket auth failed', {
        error: error.message,
      });

      next(new Error('Invalid token'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info('Socket connected', {
      socketId: socket.id,
      userId: socket.user._id,
    });

    // ── Workspace rooms ──────────────────────────────────────────
    socket.on('workspace:join', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);

      logger.debug('Socket joined workspace', {
        workspaceId,
        userId: socket.user._id,
      });
    });

    socket.on('workspace:leave', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    // ── Project rooms ────────────────────────────────────────────
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);

      logger.debug('Socket joined project', {
        projectId,
        userId: socket.user._id,
      });
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // ── User-specific room ───────────────────────────────────────
    socket.join(`user:${socket.user._id}`);

    // ── Disconnect ───────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId: socket.user._id,
        reason,
      });
    });

    // ── Error handling ───────────────────────────────────────────
    socket.on('error', (error) => {
      logger.error('Socket error', {
        socketId: socket.id,
        error: error.message,
      });
    });
  });

  logger.info('Socket.io initialized');

  return io;
}

//single getter allow other services/controller to access socket instance
export function getIO(){
    if(!io) throw new Error('Socket.io not initialized');
    return io;
}