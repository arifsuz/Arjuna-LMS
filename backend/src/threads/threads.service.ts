import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Role, MessageType, ThreadStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma';
import { EventsGateway } from '../events/events.gateway';
import { CreateThreadDto, CreateMessageDto, QueryThreadsDto } from './dto';

@Injectable()
export class ThreadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Create a new thread (question) in a course.
   * Dosen can create questions for the class.
   * Mahasiswa can create questions to the dosen.
   */
  async createThread(
    courseId: string,
    userId: string,
    userRole: Role,
    dto: CreateThreadDto,
  ) {
    // Verify user has access to this course
    await this.verifyAccess(courseId, userId, userRole);

    let expiresAt: Date | null = null;
    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);
    } else if (dto.durationMinutes && Number(dto.durationMinutes) > 0) {
      expiresAt = new Date(Date.now() + Number(dto.durationMinutes) * 60 * 1000);
    }

    const thread = await this.prisma.thread.create({
      data: {
        courseId,
        initiatorRole: userRole,
        initiatorId: userId,
        title: dto.title,
        status: ThreadStatus.OPEN,
        expiresAt: expiresAt || null,
        messages: {
          create: {
            authorId: userId,
            type: MessageType.QUESTION,
            body: dto.body,
          },
        },
      },
      include: {
        initiator: {
          select: { id: true, name: true, role: true },
        },
        messages: {
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    // Realtime broadcast to course room
    this.eventsGateway.emitToCourse(courseId, 'thread:created', thread);

    return thread;
  }

  /**
   * List threads in a course with pagination and compliance info.
   */
  async findThreadsByCourse(
    courseId: string,
    userId: string,
    userRole: Role,
    query: QueryThreadsDto,
  ) {
    await this.verifyAccess(courseId, userId, userRole);

    const { status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { courseId };
    if (status) where.status = status;

    const [threads, total] = await Promise.all([
      this.prisma.thread.findMany({
        where,
        include: {
          initiator: {
            select: { id: true, name: true, role: true },
          },
          _count: {
            select: { messages: true, opinions: true },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'asc' },
            select: {
              body: true,
              createdAt: true,
            },
          },
        },
        orderBy: { openedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.thread.count({ where }),
    ]);

    // Check & auto-expire open threads whose session time has passed
    const now = new Date();
    const processedThreads = await Promise.all(
      threads.map(async (thread) => {
        if (
          thread.status === ThreadStatus.OPEN &&
          thread.expiresAt &&
          now > new Date(thread.expiresAt)
        ) {
          try {
            await this.prisma.thread.update({
              where: { id: thread.id },
              data: {
                status: ThreadStatus.CLOSED,
                closedAt: thread.expiresAt,
              },
            });
            return {
              ...thread,
              status: ThreadStatus.CLOSED,
              closedAt: thread.expiresAt,
            };
          } catch {
            return thread;
          }
        }
        return thread;
      }),
    );

    // If user is LECTURER, include compliance info per thread
    let threadsWithCompliance = processedThreads;
    if (userRole === Role.LECTURER || userRole === Role.ADMIN) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId },
        select: { studentId: true },
      });
      const enrolledStudentIds = enrollments.map((e) => e.studentId);

      threadsWithCompliance = await Promise.all(
        processedThreads.map(async (thread) => {
          // Only check compliance for lecturer-initiated threads
          if (thread.initiatorRole !== Role.LECTURER) {
            return { ...thread, compliance: null };
          }

          const answers = await this.prisma.threadMessage.findMany({
            where: {
              threadId: thread.id,
              type: MessageType.ANSWER,
            },
            select: { authorId: true },
          });
          const answeredIds = new Set(answers.map((a) => a.authorId));

          return {
            ...thread,
            compliance: {
              total: enrolledStudentIds.length,
              answered: answeredIds.size,
              pending: enrolledStudentIds.filter(
                (id) => !answeredIds.has(id),
              ).length,
            },
          };
        }),
      );
    }

    return {
      data: threadsWithCompliance,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get full thread with all messages.
   */
  async findThreadById(threadId: string, userId: string, userRole: Role) {
    let thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        course: {
          select: { id: true, code: true, name: true, lecturerId: true },
        },
        initiator: {
          select: { id: true, name: true, role: true },
        },
        messages: {
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
            parent: {
              include: {
                author: { select: { id: true, name: true, role: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        opinions: {
          include: {
            author: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread tidak ditemukan');
    }

    // Verify access
    await this.verifyAccess(thread.courseId, userId, userRole);

    // Auto-expire thread if expiration time has passed
    const now = new Date();
    if (
      thread.status === ThreadStatus.OPEN &&
      thread.expiresAt &&
      now > new Date(thread.expiresAt)
    ) {
      thread = await this.prisma.thread.update({
        where: { id: threadId },
        data: {
          status: ThreadStatus.CLOSED,
          closedAt: thread.expiresAt,
        },
        include: {
          course: {
            select: { id: true, code: true, name: true, lecturerId: true },
          },
          initiator: {
            select: { id: true, name: true, role: true },
          },
          messages: {
            include: {
              author: {
                select: { id: true, name: true, role: true },
              },
              parent: {
                include: {
                  author: { select: { id: true, name: true, role: true } },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          opinions: {
            include: {
              author: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
      });

      this.eventsGateway.emitToThread(threadId, 'thread:closed', { threadId });
      this.eventsGateway.emitToCourse(thread.courseId, 'thread:closed', { threadId });
    }

    // Get compliance data for lecturer-initiated threads
    let compliance = null;
    if (thread.initiatorRole === Role.LECTURER) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { courseId: thread.courseId },
        include: {
          student: {
            select: { id: true, name: true },
          },
        },
      });

      const answers = thread.messages.filter(
        (m) => m.type === MessageType.ANSWER,
      );
      const answeredIds = new Set(answers.map((a) => a.author.id));

      compliance = {
        total: enrollments.length,
        answered: answeredIds.size,
        students: enrollments.map((e) => ({
          id: e.student.id,
          name: e.student.name,
          hasAnswered: answeredIds.has(e.student.id),
        })),
      };
    }

    return { ...thread, compliance };
  }

  /**
   * Add a message to a thread (Answer, Feedback, or Reaction).
   */
  async addMessage(
    threadId: string,
    userId: string,
    userRole: Role,
    dto: CreateMessageDto,
  ) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        course: { select: { lecturerId: true } },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread tidak ditemukan');
    }

    // Check expiration or closed status
    const now = new Date();
    const isExpired =
      thread.expiresAt && now > new Date(thread.expiresAt);

    if (thread.status === ThreadStatus.CLOSED || isExpired) {
      if (thread.status !== ThreadStatus.CLOSED) {
        await this.prisma.thread.update({
          where: { id: threadId },
          data: {
            status: ThreadStatus.CLOSED,
            closedAt: thread.expiresAt || new Date(),
          },
        });
      }
      throw new BadRequestException(
        'Waktu sesi diskusi telah berakhir. Forum ini telah ditutup dan tidak dapat menerima balasan.',
      );
    }

    // Verify access
    await this.verifyAccess(thread.courseId, userId, userRole);

    // If parentMessageId is provided, validate role reply constraints
    let parentMessage: any = null;
    if (dto.parentMessageId) {
      parentMessage = await this.prisma.threadMessage.findUnique({
        where: { id: dto.parentMessageId },
        include: {
          author: { select: { id: true, name: true, role: true } },
        },
      });

      if (!parentMessage || parentMessage.threadId !== threadId) {
        throw new BadRequestException('Pesan yang dibalas tidak ditemukan di thread ini.');
      }

      // Role-based reply constraints:
      // - STUDENT can ONLY reply to LECTURER (or ADMIN)
      // - LECTURER can ONLY reply to STUDENT
      // - ADMIN can reply to ANY
      if (userRole === Role.STUDENT && parentMessage.author.role === Role.STUDENT) {
        throw new BadRequestException(
          'Mahasiswa hanya dapat membalas pesan dari Dosen.',
        );
      }

      if (userRole === Role.LECTURER && parentMessage.author.role === Role.LECTURER) {
        throw new BadRequestException(
          'Dosen hanya dapat membalas pesan dari Mahasiswa.',
        );
      }
    }

    // Validate message type based on role and thread context
    this.validateMessageType(dto.type, userRole, thread, parentMessage);

    // Check duplicate answer from same student (only for top-level answer to lecturer thread)
    if (
      dto.type === MessageType.ANSWER &&
      userRole === Role.STUDENT &&
      !dto.parentMessageId
    ) {
      const existingAnswer = await this.prisma.threadMessage.findFirst({
        where: {
          threadId,
          authorId: userId,
          type: MessageType.ANSWER,
          parentMessageId: null,
        },
      });
      if (existingAnswer) {
        throw new BadRequestException('Anda sudah menjawab pertanyaan utama ini');
      }
    }

    const message = await this.prisma.threadMessage.create({
      data: {
        threadId,
        authorId: userId,
        type: dto.type,
        body: dto.body,
        parentMessageId: dto.parentMessageId || null,
      },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
        parent: {
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    // Realtime broadcast to thread room & course room
    this.eventsGateway.emitToThread(threadId, 'message:created', message);
    this.eventsGateway.emitToCourse(thread.courseId, 'message:created', {
      threadId,
      message,
    });

    return message;
  }

  /**
   * Close a thread (lecturer or admin only).
   */
  async closeThread(threadId: string, userId: string, userRole: Role) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: { course: { select: { lecturerId: true } } },
    });

    if (!thread) {
      throw new NotFoundException('Thread tidak ditemukan');
    }

    if (
      userRole !== Role.ADMIN &&
      thread.course.lecturerId !== userId
    ) {
      throw new ForbiddenException('Hanya dosen kelas ini atau admin yang bisa menutup thread');
    }

    // Validate mandatory opinion: lecturer must fill opinion before manually closing thread
    const lecturerOpinion = await this.prisma.opinion.findFirst({
      where: {
        threadId,
        authorRole: Role.LECTURER,
      },
    });

    if (!lecturerOpinion || !lecturerOpinion.opinionText || lecturerOpinion.opinionText.trim().length === 0) {
      throw new BadRequestException(
        'Dosen wajib mengisi form Refleksi & Opini terlebih dahulu sebelum dapat menutup forum diskusi ini secara manual.',
      );
    }

    const updated = await this.prisma.thread.update({
      where: { id: threadId },
      data: {
        status: ThreadStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    // Realtime broadcast thread:closed
    this.eventsGateway.emitToThread(threadId, 'thread:closed', { threadId });
    this.eventsGateway.emitToCourse(thread.courseId, 'thread:closed', { threadId });

    return updated;
  }

  // ─── Private helpers ───────────────────────────────────────────────

  private async verifyAccess(
    courseId: string,
    userId: string,
    userRole: Role,
  ) {
    if (userRole === Role.ADMIN) return;

    if (userRole === Role.LECTURER) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });
      if (!course || course.lecturerId !== userId) {
        throw new ForbiddenException('Anda bukan dosen kelas ini');
      }
      return;
    }

    // STUDENT — must be enrolled
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: { courseId, studentId: userId },
      },
    });
    if (!enrollment) {
      throw new ForbiddenException('Anda tidak terdaftar di kelas ini');
    }
  }

  private validateMessageType(
    type: MessageType,
    role: Role,
    thread: any,
    parentMessage?: any,
  ) {
    // QUESTION: only for new threads (handled in createThread)
    if (type === MessageType.QUESTION) {
      throw new BadRequestException(
        'Gunakan endpoint create thread untuk pertanyaan baru',
      );
    }

    // Admin is permitted to participate in all roles for monitoring/testing
    if (role === Role.ADMIN) {
      return;
    }

    // If replying directly to a parent message, check role compatibility
    if (parentMessage) {
      if (role === Role.STUDENT && type === MessageType.FEEDBACK) {
        throw new BadRequestException('Mahasiswa tidak dapat mengirim tipe pesan feedback.');
      }
      if (role === Role.LECTURER && type === MessageType.REACTION) {
        throw new BadRequestException('Dosen tidak dapat mengirim tipe pesan reaksi mahasiswa.');
      }
      return;
    }

    // Top-level message validation:
    // ANSWER:
    // - Student can answer lecturer's question
    // - Lecturer can answer student's question
    if (type === MessageType.ANSWER) {
      if (
        role === Role.STUDENT &&
        thread.initiatorRole !== Role.LECTURER
      ) {
        throw new BadRequestException(
          'Mahasiswa hanya bisa menjawab pertanyaan dosen',
        );
      }
      if (
        role === Role.LECTURER &&
        thread.initiatorRole !== Role.STUDENT
      ) {
        throw new BadRequestException(
          'Dosen menjawab pertanyaan mahasiswa',
        );
      }
    }

    // FEEDBACK: only lecturer (admin already returned early)
    if (type === MessageType.FEEDBACK && role !== Role.LECTURER) {
      throw new BadRequestException('Hanya dosen yang bisa memberi feedback');
    }

    // REACTION: only student (admin already returned early)
    if (type === MessageType.REACTION && role !== Role.STUDENT) {
      throw new BadRequestException(
        'Hanya mahasiswa yang bisa memberi reaksi',
      );
    }
  }
}
