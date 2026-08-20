import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../common/prisma';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto, QueryUsersDto, BulkImportResultDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async findAll(query: QueryUsersDto) {
    const { role, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
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
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
}
