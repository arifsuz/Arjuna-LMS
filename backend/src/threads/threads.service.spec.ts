import { Test, TestingModule } from '@nestjs/testing';
import { ThreadsService } from './threads.service';
import { PrismaService } from '../common/prisma';
import { EventsGateway } from '../events/events.gateway';
import { Role, ThreadStatus, MessageType } from '@prisma/client';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('ThreadsService Unit Test (Forum Auto-Expiration & Role-Based Replies)', () => {
  let service: ThreadsService;
  let prisma: any;
  let eventsGateway: any;

  beforeEach(async () => {
    const mockPrisma = {
      course: {
        findUnique: jest.fn(),
      },
      enrollment: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      thread: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
      threadMessage: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const mockEventsGateway = {
      emitToCourse: jest.fn(),
      emitToThread: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThreadsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<ThreadsService>(ThreadsService);
    prisma = module.get(PrismaService);
    eventsGateway = module.get(EventsGateway);
  });

  describe('createThread with Session Expiration', () => {
    it('TC-THREAD-001: Should create a thread with calculated expiresAt when durationMinutes is provided', async () => {
      prisma.course.findUnique.mockResolvedValue({
        id: 'course-1',
        lecturerId: 'dosen-1',
      });

      const mockCreatedThread = {
        id: 'thread-1',
        courseId: 'course-1',
        initiatorId: 'dosen-1',
        initiatorRole: Role.LECTURER,
        title: 'Diskusi Algoritma',
        status: ThreadStatus.OPEN,
        expiresAt: new Date(Date.now() + 120 * 60 * 1000),
      };
      prisma.thread.create.mockResolvedValue(mockCreatedThread);

      const result = await service.createThread('course-1', 'dosen-1', Role.LECTURER, {
        title: 'Diskusi Algoritma',
        body: 'Jelaskan konsep Dynamic Programming',
        durationMinutes: 120,
      });

      expect(prisma.thread.create).toHaveBeenCalled();
      const createArgs = prisma.thread.create.mock.calls[0][0];
      expect(createArgs.data.expiresAt).toBeInstanceOf(Date);
      expect(result.id).toBe('thread-1');
      expect(eventsGateway.emitToCourse).toHaveBeenCalledWith(
        'course-1',
        'thread:created',
        mockCreatedThread,
      );
    });
  });

  describe('Forum Auto-Expiration on Adding Messages', () => {
    it('TC-THREAD-002: Should reject adding message if thread session has expired', async () => {
      const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
      prisma.thread.findUnique.mockResolvedValue({
        id: 'thread-1',
        courseId: 'course-1',
        status: ThreadStatus.OPEN,
        expiresAt: pastDate,
        course: { lecturerId: 'dosen-1' },
      });
      prisma.enrollment.findUnique.mockResolvedValue({
        courseId: 'course-1',
        studentId: 'mhs-1',
      });

      await expect(
        service.addMessage('thread-1', 'mhs-1', Role.STUDENT, {
          type: MessageType.ANSWER,
          body: 'Jawaban saya...',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.thread.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'thread-1' },
          data: expect.objectContaining({ status: ThreadStatus.CLOSED }),
        }),
      );
    });
  });

  describe('Role-Based Reply System Constraints', () => {
    it('TC-THREAD-003: Mahasiswa CAN reply to Dosen message', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000);
      prisma.thread.findUnique.mockResolvedValue({
        id: 'thread-1',
        courseId: 'course-1',
        status: ThreadStatus.OPEN,
        expiresAt: futureDate,
        course: { lecturerId: 'dosen-1' },
      });
      prisma.enrollment.findUnique.mockResolvedValue({
        courseId: 'course-1',
        studentId: 'mhs-1',
      });
      prisma.threadMessage.findUnique.mockResolvedValue({
        id: 'msg-parent-dosen',
        threadId: 'thread-1',
        author: { id: 'dosen-1', name: 'Dr. Aris', role: Role.LECTURER },
      });
      prisma.threadMessage.create.mockResolvedValue({
        id: 'msg-reply-mhs',
        threadId: 'thread-1',
        authorId: 'mhs-1',
        body: 'Jawaban mahasiswa...',
        parentMessageId: 'msg-parent-dosen',
        author: { id: 'mhs-1', name: 'Aditya', role: Role.STUDENT },
      });

      const reply = await service.addMessage('thread-1', 'mhs-1', Role.STUDENT, {
        type: MessageType.ANSWER,
        body: 'Jawaban mahasiswa...',
        parentMessageId: 'msg-parent-dosen',
      });

      expect(reply.id).toBe('msg-reply-mhs');
      expect(prisma.threadMessage.create).toHaveBeenCalled();
    });

    it('TC-THREAD-004: Mahasiswa CANNOT reply to another Mahasiswa message', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000);
      prisma.thread.findUnique.mockResolvedValue({
        id: 'thread-1',
        courseId: 'course-1',
        status: ThreadStatus.OPEN,
        expiresAt: futureDate,
        course: { lecturerId: 'dosen-1' },
      });
      prisma.enrollment.findUnique.mockResolvedValue({
        courseId: 'course-1',
        studentId: 'mhs-1',
      });
      prisma.threadMessage.findUnique.mockResolvedValue({
        id: 'msg-parent-mhs2',
        threadId: 'thread-1',
        author: { id: 'mhs-2', name: 'Budi', role: Role.STUDENT },
      });

      await expect(
        service.addMessage('thread-1', 'mhs-1', Role.STUDENT, {
          type: MessageType.ANSWER,
          body: 'Saya membalas teman mahasiswa...',
          parentMessageId: 'msg-parent-mhs2',
        }),
      ).rejects.toThrow(
        new BadRequestException('Mahasiswa hanya dapat membalas pesan dari Dosen.'),
      );
    });

    it('TC-THREAD-005: Dosen CAN reply to Mahasiswa message (Feedback)', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000);
      prisma.thread.findUnique.mockResolvedValue({
        id: 'thread-1',
        courseId: 'course-1',
        status: ThreadStatus.OPEN,
        expiresAt: futureDate,
        course: { lecturerId: 'dosen-1' },
      });
      prisma.course.findUnique.mockResolvedValue({
        id: 'course-1',
        lecturerId: 'dosen-1',
      });
      prisma.threadMessage.findUnique.mockResolvedValue({
        id: 'msg-mhs-answer',
        threadId: 'thread-1',
        author: { id: 'mhs-1', name: 'Aditya', role: Role.STUDENT },
      });
      prisma.threadMessage.create.mockResolvedValue({
        id: 'msg-dosen-feedback',
        threadId: 'thread-1',
        authorId: 'dosen-1',
        body: 'Feedback dosen: Penjelasan sudah tepat.',
        parentMessageId: 'msg-mhs-answer',
        author: { id: 'dosen-1', name: 'Dr. Aris', role: Role.LECTURER },
      });

      const reply = await service.addMessage('thread-1', 'dosen-1', Role.LECTURER, {
        type: MessageType.FEEDBACK,
        body: 'Feedback dosen: Penjelasan sudah tepat.',
        parentMessageId: 'msg-mhs-answer',
      });

      expect(reply.id).toBe('msg-dosen-feedback');
    });

    it('TC-THREAD-006: Dosen CANNOT reply to another Dosen message', async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000);
      prisma.thread.findUnique.mockResolvedValue({
        id: 'thread-1',
        courseId: 'course-1',
        status: ThreadStatus.OPEN,
        expiresAt: futureDate,
        course: { lecturerId: 'dosen-1' },
      });
      prisma.course.findUnique.mockResolvedValue({
        id: 'course-1',
        lecturerId: 'dosen-1',
      });
      prisma.threadMessage.findUnique.mockResolvedValue({
        id: 'msg-dosen-parent',
        threadId: 'thread-1',
        author: { id: 'dosen-2', name: 'Dr. Sinta', role: Role.LECTURER },
      });

      await expect(
        service.addMessage('thread-1', 'dosen-1', Role.LECTURER, {
          type: MessageType.FEEDBACK,
          body: 'Balasan ke sesama dosen...',
          parentMessageId: 'msg-dosen-parent',
        }),
      ).rejects.toThrow(
        new BadRequestException('Dosen hanya dapat membalas pesan dari Mahasiswa.'),
      );
    });
  });

  describe('closeThread (Manual Close by Lecturer)', () => {
    it('TC-THREAD-007: Should reject closing thread if user is not course lecturer or admin', async () => {
      prisma.thread.findUnique.mockResolvedValue({
        id: 'thread-1',
        courseId: 'course-1',
        status: ThreadStatus.OPEN,
        course: { lecturerId: 'dosen-1' },
      });

      await expect(
        service.closeThread('thread-1', 'dosen-2', Role.LECTURER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('TC-THREAD-008: Should successfully close thread manually by lecturer', async () => {
      prisma.thread.findUnique.mockResolvedValue({
        id: 'thread-1',
        courseId: 'course-1',
        status: ThreadStatus.OPEN,
        course: { lecturerId: 'dosen-1' },
      });
      prisma.thread.update.mockResolvedValue({
        id: 'thread-1',
        status: ThreadStatus.CLOSED,
      });

      const result = await service.closeThread('thread-1', 'dosen-1', Role.LECTURER);
      expect(result.status).toBe(ThreadStatus.CLOSED);
      expect(prisma.thread.update).toHaveBeenCalled();
      expect(eventsGateway.emitToThread).toHaveBeenCalledWith('thread-1', 'thread:closed', { threadId: 'thread-1' });
    });
  });
});
