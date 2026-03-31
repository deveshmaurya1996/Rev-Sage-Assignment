import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface DocumentUpdatePayload {
  documentId: string;
  status: string;
  result: string | null;
  processorDisplayName: string | null;
  updatedAt: string;
}

@WebSocketGateway({
  namespace: '/documents',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class DocumentsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(DocumentsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth as { token?: string })?.token ??
      (client.handshake.query.token as string | undefined);
    if (!token || typeof token !== 'string') {
      this.logger.warn('WS connect rejected: missing token');
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });
      const room = this.userRoom(payload.sub);
      void client.join(room);
    } catch {
      this.logger.warn('WS connect rejected: invalid token');
      client.disconnect(true);
    }
  }

  emitDocumentUpdate(userId: string, payload: DocumentUpdatePayload) {
    this.server.to(this.userRoom(userId)).emit('document:update', payload);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }
}
