import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
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

    // Check if user already submitted an opinion on this thread
    const existing = await this.prisma.opinion.findFirst({
      where: {
        threadId,
        authorId: userId,
      },
    });

    let opinion;
    if (existing) {
      opinion = await this.prisma.opinion.update({
        where: { id: existing.id },
        data: {
          opinionText: dto.opinionText,
        },
        include: {
          author: {
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
          opinionText: dto.opinionText,
        },
        include: {
          author: {
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

    return this.prisma.opinion.findMany({
      where: { threadId },
      include: {
        author: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
