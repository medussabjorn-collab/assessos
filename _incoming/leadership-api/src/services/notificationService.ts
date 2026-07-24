import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger';

let io: SocketServer | null = null;

export function setSocketServer(server: SocketServer): void {
  io = server;
}

export interface CreateNotificationDto {
  userId:   string;
  type:     'info' | 'success' | 'warning' | 'error';
  title:    string;
  message:  string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(dto: CreateNotificationDto) {
  const notification = await prisma.notification.create({
    data: {
      userId:   dto.userId,
      type:     dto.type,
      title:    dto.title,
      message:  dto.message,
      metadata: (dto.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });

  // Push real-time via Socket.io
  if (io) {
    io.to(`user:${dto.userId}`).emit('notification', notification);
    logger.debug(`Notification pushed to user:${dto.userId}`);
  }

  return notification;
}

export async function getUserNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function markNotificationRead(id: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data:  { read: true },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data:  { read: true },
  });
}

export async function notifyAssessmentComplete(userId: string, moduleId: string, score: number, passed: boolean) {
  await createNotification({
    userId,
    type:    passed ? 'success' : 'warning',
    title:   `${moduleId} assessment complete`,
    message: `You scored ${score.toFixed(1)}% — ${passed ? '✅ Passed' : '❌ Did not pass'}`,
    metadata: { moduleId, score, passed },
  });
}

export async function notifyProctoringAlert(userId: string, sessionId: string, eventType: string, risk: number) {
  await createNotification({
    userId,
    type:    risk >= 70 ? 'error' : 'warning',
    title:   'Proctoring alert',
    message: `Event: ${eventType.replace(/_/g, ' ')} · Risk score: ${risk}`,
    metadata: { sessionId, eventType, risk },
  });
}
