import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';

describe('EventsGateway Unit Test (Real-Time WebSocket & Network Layer)', () => {
  let gateway: EventsGateway;
  let jwtService: any;
  let configService: any;

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest.fn(),
    };
    configService = {
      get: jest.fn().mockReturnValue('jwt-secret-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    gateway = module.get<EventsGateway>(EventsGateway);
    gateway.server = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;
  });

  it('TC-NET-001: Should authenticate incoming socket connection with valid JWT token', async () => {
    const mockSocket: any = {
      id: 'socket-123',
      handshake: {
        auth: { token: 'valid-jwt-token' },
      },
      data: {},
    };

    jwtService.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      email: 'mahasiswa1@arjuna-lms.ac.id',
      role: 'STUDENT',
    });

    await gateway.handleConnection(mockSocket);

    expect(mockSocket.data.user).toBeDefined();
    expect(mockSocket.data.user.email).toBe('mahasiswa1@arjuna-lms.ac.id');
  });

  it('TC-NET-002: Should subscribe client to specific course room', () => {
    const mockSocket: any = {
      id: 'socket-123',
      join: jest.fn(),
    };

    const res = gateway.handleJoinCourse(mockSocket, { courseId: 'course-99' });

    expect(mockSocket.join).toHaveBeenCalledWith('course:course-99');
    expect(res).toEqual({ status: 'joined', room: 'course:course-99' });
  });

  it('TC-NET-003: Should subscribe client to specific thread room for live discussion', () => {
    const mockSocket: any = {
      id: 'socket-123',
      join: jest.fn(),
    };

    const res = gateway.handleJoinThread(mockSocket, { threadId: 'thread-77' });

    expect(mockSocket.join).toHaveBeenCalledWith('thread:thread-77');
    expect(res).toEqual({ status: 'joined', room: 'thread:thread-77' });
  });

  it('TC-NET-004: Should broadcast new message to thread and course rooms', () => {
    const mockMessage: any = {
      id: 'msg-1',
      type: 'ANSWER',
      body: 'Jawaban saya atas pertanyaan ini.',
      threadId: 'thread-77',
      courseId: 'course-99',
    };

    gateway.emitToThread('thread-77', 'newMessage', mockMessage);
    gateway.emitToCourse('course-99', 'newMessage', mockMessage);

    expect(gateway.server.to).toHaveBeenCalledWith('thread:thread-77');
    expect(gateway.server.to).toHaveBeenCalledWith('course:course-99');
    expect(gateway.server.emit).toHaveBeenCalledWith('newMessage', mockMessage);
  });
});
