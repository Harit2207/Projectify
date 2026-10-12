import { getIO } from "../../config/socket.js";
import { logger } from '../../core/logger/logger.js';

export function emitToProject(projectId, event, payload) {
    try {
        getIO.to(`project:${projectId}`).emit(event, payload);
    } catch (error) {
        logger.error('Failed to emit socket event', {
            event,
            projectId,
            error: error.message,
        });
    }
}

export function emitToWorkspace(workspaceId, event, payload) {
    try {
        getIO.to(`workspace:${workspaceId}`).emit(event, payload);
    } catch (error) {
        logger.error('Failed to emit socket event', {
            event,
            workspaceId,
            error: error.message,
        });
    }
}

export function emitToUser(userId, event, payload) {
    try {
        getIO.to(`user:${userId}`).emit(event, payload);
    } catch (error) {
        logger.error('Failed to emit socket event', {
            event,
            userId: userId.toString(),
            error: error.message,
        });
    }
}