import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Ported from leadership-assessment's socket.io setup (app.ts). Clients emit
// `join` with their userId (+ tenantId) to subscribe to their room; the server
// pushes to `user:<id>` / `tenant:<id>` rooms.
//
// TODO(auth): the join is currently trust-on-assert (same as leadership) — when
// Firebase auth is wired (final merge phase), verify the socket handshake token
// and derive userId/tenantId from it instead of trusting the client payload.
@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3001').split(','),
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(socket: Socket) {
    this.logger.debug(`Socket connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    this.logger.debug(`Socket disconnected: ${socket.id}`);
  }

  @SubscribeMessage('join')
  onJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { userId?: string; tenantId?: string },
  ) {
    if (body?.userId) socket.join(`user:${body.userId}`);
    if (body?.tenantId) socket.join(`tenant:${body.tenantId}`);
    return { joined: true, rooms: [...socket.rooms].filter((r) => r !== socket.id) };
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  emitToTenant(tenantId: string, event: string, payload: unknown) {
    this.server?.to(`tenant:${tenantId}`).emit(event, payload);
  }
}
