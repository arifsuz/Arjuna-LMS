import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      // Allow localhost, 127.0.0.1 and any configured origin
      callback(null, true);
    },
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from query or auth header or cookie
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        client.handshake.query?.token;

      if (token) {
        const payload = await this.jwtService.verifyAsync(token as string, {
          secret:
            this.configService.get<string>('JWT_ACCESS_SECRET') ||
            'arjuna-access-secret-change-in-production',
        });
        client.data.user = payload;
        this.logger.log(`Socket client connected: ${client.id} (User: ${payload.email})`);
      } else {
        this.logger.log(`Socket client connected anonymously: ${client.id}`);
      }
    } catch {
      this.logger.warn(`Socket client auth error for connection: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinCourse')
  handleJoinCourse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { courseId: string },
  ) {
    if (data?.courseId) {
      client.join(`course:${data.courseId}`);
      this.logger.debug(`Client ${client.id} joined room course:${data.courseId}`);
      return { status: 'joined', room: `course:${data.courseId}` };
    }
  }

  @SubscribeMessage('leaveCourse')
  handleLeaveCourse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { courseId: string },
  ) {
    if (data?.courseId) {
      client.leave(`course:${data.courseId}`);
      return { status: 'left', room: `course:${data.courseId}` };
    }
  }

  @SubscribeMessage('joinThread')
  handleJoinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string },
  ) {
    if (data?.threadId) {
      client.join(`thread:${data.threadId}`);
      this.logger.debug(`Client ${client.id} joined room thread:${data.threadId}`);
      return { status: 'joined', room: `thread:${data.threadId}` };
    }
  }

  @SubscribeMessage('leaveThread')
  handleLeaveThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { threadId: string },
  ) {
    if (data?.threadId) {
      client.leave(`thread:${data.threadId}`);
      return { status: 'left', room: `thread:${data.threadId}` };
    }
  }

  // Helper broadcast methods used by services
  emitToThread(threadId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`thread:${threadId}`).emit(event, data);
    }
  }

  emitToCourse(courseId: string, event: string, data: any) {
    if (this.server) {
      this.server.to(`course:${courseId}`).emit(event, data);
    }
  }
}
