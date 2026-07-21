import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../../database/prisma.service';

// Ported from leadership-assessment's socket.io setup (app.ts), then hardened
// in Phase 4 (real auth): userId/tenantId are now resolved server-side from a
// verified Firebase ID token sent in the connection handshake
// (`io(url, { auth: { token } })` — lib/socket.ts already sent this from the
// realtime-module commit onward, the backend just didn't check it yet).
// Previously `join` trusted whatever {userId, tenantId} the client sent in
// the message body — a client could claim ANY tenantId and receive that
// tenant's live notifications/proctoring alerts. Now the client can't assert
// its own room membership at all; rooms are derived from the verified token
// + a real Prisma lookup, the same identity resolution FirebaseAuthGuard uses
// for HTTP requests.
@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3001').split(','),
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const { uid, tenantId: claimedTenantId } = await this.resolveIdentity(socket);
      const user = await this.prisma.user.findFirst({
        where: { firebaseUid: uid, ...(claimedTenantId ? { tenantId: claimedTenantId } : {}) },
      });
      if (!user) {
        socket.disconnect(true);
        return;
      }
      socket.data.userId = user.id;
      socket.data.tenantId = user.tenantId;
      socket.join(`user:${user.id}`);
      socket.join(`tenant:${user.tenantId}`);
      this.logger.debug(`Socket connected: ${socket.id} -> user:${user.id}`);
    } catch (err) {
      this.logger.debug(`Socket auth failed, disconnecting: ${err}`);
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.debug(`Socket disconnected: ${socket.id}`);
  }

  // Client no longer needs to (or can) assert its own room membership — the
  // server already joined the right rooms in handleConnection. Kept as a
  // no-op ack so the existing client's join-and-await-ack flow still works
  // without a protocol change.
  @SubscribeMessage('join')
  onJoin(@ConnectedSocket() socket: Socket) {
    return { joined: true, rooms: [...socket.rooms].filter((r) => r !== socket.id) };
  }

  // DEV ONLY — mirrors FirebaseAuthGuard's AUTH_DISABLED bypass so socket
  // testing doesn't require a full Firebase login in local dev. Never set in
  // a real deployment (same guard as everywhere else this flag is checked).
  private async resolveIdentity(socket: Socket): Promise<{ uid: string; tenantId?: string }> {
    if (process.env.AUTH_DISABLED === 'true') {
      return {
        uid: (socket.handshake.auth?.devUid as string) || process.env.AUTH_DISABLED_UID || 'seed-manager-uid',
        tenantId: socket.handshake.auth?.tenantId as string | undefined,
      };
    }
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) throw new Error('No auth token in socket handshake');
    const decoded = await this.authService.verifyIdToken(token);
    return { uid: decoded.uid };
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  emitToTenant(tenantId: string, event: string, payload: unknown) {
    this.server?.to(`tenant:${tenantId}`).emit(event, payload);
  }
}
