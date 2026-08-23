import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role, LabelSource } from '@prisma/client';
import { PrismaService } from '../common/prisma';
import { EventsGateway } from '../events/events.gateway';
import { CreateOpinionDto } from './dto';

@Injectable()
export class OpinionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async createOpinion(
    threadId: string,
    userId: string,
    userRole: Role,
    dto: CreateOpinionDto,
  ) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        course: { select: { id: true, lecturerId: true } },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread tidak ditemukan');
    }

    // Verify user is enrolled or is lecturer or admin
    if (userRole === Role.STUDENT) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: thread.course.id,
            studentId: userId,
          },
        },
      });
      if (!enrollment) {
        throw new ForbiddenException('Anda tidak terdaftar di kelas ini');
      }
    } else if (userRole === Role.LECTURER) {
      if (thread.course.lecturerId !== userId) {
        throw new ForbiddenException('Anda bukan dosen kelas ini');
      }
    }

    // Check if user already submitted an opinion on this thread for the target student (or self)
    const targetStudentId = dto.targetStudentId || null;
    const existing = await this.prisma.opinion.findFirst({
      where: {
        threadId,
        authorId: userId,
        targetStudentId,
      },
    });

    let opinion;
    if (existing) {
      opinion = await this.prisma.opinion.update({
        where: { id: existing.id },
        data: {
          opinionText: dto.opinionText !== undefined ? dto.opinionText : existing.opinionText,
          sentiment: dto.sentiment !== undefined ? (dto.sentiment || null) : existing.sentiment,
          emotion: dto.emotion !== undefined ? (dto.emotion || null) : existing.emotion,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
          targetStudent: {
            select: { id: true, name: true, role: true },
          },
        },
      });
    } else {
      opinion = await this.prisma.opinion.create({
        data: {
          threadId,
          authorId: userId,
          authorRole: userRole,
          targetStudentId,
          opinionText: dto.opinionText || '',
          sentiment: dto.sentiment || null,
          emotion: dto.emotion || null,
        },
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
          targetStudent: {
            select: { id: true, name: true, role: true },
          },
        },
      });
    }

    // Real-time broadcast
    this.eventsGateway.emitToThread(threadId, 'opinion:submitted', opinion);

    return opinion;
  }

  async findByThread(threadId: string, userId: string, userRole: Role) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: { course: true },
    });

    if (!thread) {
      throw new NotFoundException('Thread tidak ditemukan');
    }

    const where: any = { threadId };
    if (userRole === Role.STUDENT) {
      where.authorId = userId;
    } else if (userRole === Role.LECTURER) {
      where.authorId = userId;
    }

    return this.prisma.opinion.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
        targetStudent: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
