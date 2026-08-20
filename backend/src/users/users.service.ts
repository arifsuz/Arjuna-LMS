import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma';
import { AuthService } from '../auth/auth.service';
import {
  CreateUserDto,
  UpdateUserDto,
  QueryUsersDto,
  BulkImportResultDto,
} from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async findAll(query: QueryUsersDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total, roleCounts] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          createdByAdmin: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
      }),
    ]);

    const counts: Record<string, number> = {
      all: 0,
      LECTURER: 0,
      STUDENT: 0,
      ADMIN: 0,
    };

    let allTotal = 0;
    for (const item of roleCounts) {
      counts[item.role] = item._count._all;
      allTotal += item._count._all;
    }
    counts.all = allTotal;

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      counts,
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        enrollments: {
          include: {
            course: {
              select: { id: true, code: true, name: true },
            },
          },
        },
        taughtCourses: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async create(dto: CreateUserDto, adminId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const passwordHash = await this.authService.hashPassword(dto.password);

    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        createdByAdmin: adminId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  /**
   * Bulk import users from parsed CSV data.
   * Expected CSV columns: name, email, password, role
   */
  async bulkImport(
    rows: Array<{ name: string; email: string; password: string; role: string }>,
    adminId: string,
  ): Promise<BulkImportResultDto> {
    const result: BulkImportResultDto = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header

      try {
        // Validate role
        const role = row.role?.toUpperCase() as Role;
        if (!['ADMIN', 'LECTURER', 'STUDENT'].includes(role)) {
          result.errors.push({
            row: rowNum,
            email: row.email || '',
            reason: `Role tidak valid: ${row.role}`,
          });
          continue;
        }

        // Check if email exists
        const existing = await this.prisma.user.findUnique({
          where: { email: row.email },
        });

        if (existing) {
          result.skipped++;
          continue;
        }

        const passwordHash = await this.authService.hashPassword(
          row.password || 'changeme123',
        );

        await this.prisma.user.create({
          data: {
            name: row.name,
            email: row.email,
            passwordHash,
            role,
            createdByAdmin: adminId,
          },
        });

        result.created++;
      } catch (err: any) {
        result.errors.push({
          row: rowNum,
          email: row.email || '',
          reason: err.message || 'Unknown error',
        });
      }
    }

    return result;
  }

  async resetPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const passwordHash = await this.authService.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password berhasil direset' };
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (dto.email && dto.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('Email sudah digunakan oleh user lain');
      }
    }

    const dataToUpdate: any = {};
    if (dto.name !== undefined) dataToUpdate.name = dto.name;
    if (dto.email !== undefined) dataToUpdate.email = dto.email;
    if (dto.role !== undefined) dataToUpdate.role = dto.role;

    if (dto.password && dto.password.trim() !== '') {
      dataToUpdate.passwordHash = await this.authService.hashPassword(
        dto.password,
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        createdByAdmin: true,
      },
    });
  }

  async delete(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new BadRequestException('Tidak dapat menghapus akun Anda sendiri');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Unlink createdByAdmin
      await tx.user.updateMany({
        where: { createdByAdmin: id },
        data: { createdByAdmin: null },
      });

      // 2. Unlink dataset_labels labeledBy
      await tx.datasetLabel.updateMany({
        where: { labeledBy: id },
        data: { labeledBy: null },
      });

      // 3. Delete audit logs where actorId = id
      await tx.auditLog.deleteMany({
        where: { actorId: id },
      });

      // 4. Delete opinions where authorId = id
      await tx.opinion.deleteMany({
        where: { authorId: id },
      });

      // 5. Delete thread messages where authorId = id
      await tx.threadMessage.deleteMany({
        where: { authorId: id },
      });

      // 6. Delete threads where initiatorId = id (cascades messages, opinions, datasetLabels)
      await tx.thread.deleteMany({
        where: { initiatorId: id },
      });

      // 7. Delete courses where lecturerId = id (cascades threads, enrollments)
      await tx.course.deleteMany({
        where: { lecturerId: id },
      });

      // 8. Delete enrollments where studentId = id
      await tx.enrollment.deleteMany({
        where: { studentId: id },
      });

      // 9. Delete user
      await tx.user.delete({
        where: { id },
      });

      return { message: 'Akun user berhasil dihapus' };
    });
  }

  async bulkDelete(userIds: string[], currentAdminId: string) {
    const targetIds = userIds.filter((id) => id !== currentAdminId);

    if (targetIds.length === 0) {
      throw new BadRequestException(
        'Tidak ada akun yang valid untuk dihapus (akun sendiri tidak dapat dihapus)',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Unlink createdByAdmin
      await tx.user.updateMany({
        where: { createdByAdmin: { in: targetIds } },
        data: { createdByAdmin: null },
      });

      // 2. Unlink dataset_labels labeledBy
      await tx.datasetLabel.updateMany({
        where: { labeledBy: { in: targetIds } },
        data: { labeledBy: null },
      });

      // 3. Delete audit logs
      await tx.auditLog.deleteMany({
        where: { actorId: { in: targetIds } },
      });

      // 4. Delete opinions
      await tx.opinion.deleteMany({
        where: { authorId: { in: targetIds } },
      });

      // 5. Delete thread messages
      await tx.threadMessage.deleteMany({
        where: { authorId: { in: targetIds } },
      });

      // 6. Delete threads
      await tx.thread.deleteMany({
        where: { initiatorId: { in: targetIds } },
      });

      // 7. Delete courses
      await tx.course.deleteMany({
        where: { lecturerId: { in: targetIds } },
      });

      // 8. Delete enrollments
      await tx.enrollment.deleteMany({
        where: { studentId: { in: targetIds } },
      });

      // 9. Delete users
      const result = await tx.user.deleteMany({
        where: { id: { in: targetIds } },
      });

      return {
        message: `${result.count} akun pengguna berhasil dihapus`,
        count: result.count,
        skippedSelf: userIds.includes(currentAdminId),
      };
    });
  }

  async bulkUpdateRole(userIds: string[], role: Role, currentAdminId: string) {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('Daftar pengguna tidak boleh kosong');
    }

    const result = await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { role },
    });

    return {
      message: `${result.count} pengguna berhasil diubah rolenya menjadi ${role}`,
      count: result.count,
    };
  }

  async bulkResetPassword(userIds: string[], newPassword: string) {
    if (!userIds || userIds.length === 0) {
      throw new BadRequestException('Daftar pengguna tidak boleh kosong');
    }

    const passwordHash = await this.authService.hashPassword(newPassword);

    const result = await this.prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { passwordHash },
    });

    return {
      message: `Password berhasil direset untuk ${result.count} pengguna`,
      count: result.count,
    };
  }
}
