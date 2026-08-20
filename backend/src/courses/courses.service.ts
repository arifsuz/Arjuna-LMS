import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma';
import { CreateCourseDto, UpdateCourseDto, EnrollStudentsDto } from './dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      include: {
        lecturer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            enrollments: true,
            threads: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        lecturer: {
          select: { id: true, name: true, email: true },
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: { threads: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }

    return course;
  }

  /**
   * Find courses accessible by a specific user.
   * - ADMIN: all courses
   * - LECTURER: courses they teach
   * - STUDENT: courses they're enrolled in
   */
  async findByUser(userId: string, userRole: Role) {
    if (userRole === Role.ADMIN) {
      return this.findAll();
    }

    if (userRole === Role.LECTURER) {
      return this.prisma.course.findMany({
        where: { lecturerId: userId },
        include: {
          lecturer: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { enrollments: true, threads: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // STUDENT
    return this.prisma.course.findMany({
      where: {
        enrollments: {
          some: { studentId: userId },
        },
      },
      include: {
        lecturer: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { enrollments: true, threads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateCourseDto) {
    // Validate lecturer exists and has LECTURER role
    const lecturer = await this.prisma.user.findUnique({
      where: { id: dto.lecturerId },
    });

    if (!lecturer || lecturer.role !== Role.LECTURER) {
      throw new BadRequestException('Lecturer ID tidak valid');
    }

    // Check course code uniqueness
    const existing = await this.prisma.course.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Kode kelas sudah digunakan');
    }

    return this.prisma.course.create({
      data: {
        code: dto.code,
        name: dto.name,
        lecturerId: dto.lecturerId,
        term: dto.term,
      },
      include: {
        lecturer: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }

    if (dto.code && dto.code !== course.code) {
      const existing = await this.prisma.course.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Kode kelas sudah digunakan');
      }
    }

    if (dto.lecturerId) {
      const lecturer = await this.prisma.user.findUnique({
        where: { id: dto.lecturerId },
      });
      if (!lecturer || lecturer.role !== Role.LECTURER) {
        throw new BadRequestException('Lecturer ID tidak valid');
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: dto,
      include: {
        lecturer: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async delete(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }

    await this.prisma.course.delete({
      where: { id },
    });

    return { message: 'Kelas berhasil dihapus' };
  }

  async enrollStudents(courseId: string, dto: EnrollStudentsDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }

    // Validate all students exist and have STUDENT role
    const students = await this.prisma.user.findMany({
      where: {
        id: { in: dto.studentIds },
        role: Role.STUDENT,
      },
    });

    if (students.length !== dto.studentIds.length) {
      throw new BadRequestException(
        'Beberapa Student ID tidak valid atau bukan mahasiswa',
      );
    }

    // Upsert enrollments (skip if already enrolled)
    const results = await Promise.allSettled(
      dto.studentIds.map((studentId) =>
        this.prisma.enrollment.upsert({
          where: {
            courseId_studentId: { courseId, studentId },
          },
          create: { courseId, studentId },
          update: {},
        }),
      ),
    );

    const enrolled = results.filter((r) => r.status === 'fulfilled').length;
    return { message: `${enrolled} mahasiswa berhasil di-enroll`, enrolled };
  }

  async unenrollStudent(courseId: string, studentId: string) {
    try {
      await this.prisma.enrollment.delete({
        where: {
          courseId_studentId: { courseId, studentId },
        },
      });
      return { message: 'Mahasiswa berhasil di-unenroll' };
    } catch {
      throw new NotFoundException('Enrollment tidak ditemukan');
    }
  }
}
