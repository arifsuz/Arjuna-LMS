import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Readable } from 'stream';
import * as csv from 'fast-csv';
import { UsersService } from './users.service';
import { CreateUserDto, ResetPasswordDto, QueryUsersDto } from './dto';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import { Role } from '@prisma/client';

@Controller('admin/users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser('id') adminId: string) {
    return this.usersService.create(dto, adminId);
  }

  @Post('bulk-import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        if (
          file.mimetype === 'text/csv' ||
          file.originalname.endsWith('.csv')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Hanya file CSV yang diterima'), false);
        }
      },
    }),
  )
  async bulkImport(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') adminId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File CSV wajib diupload');
    }

    const rows: Array<{
      name: string;
      email: string;
      password: string;
      role: string;
    }> = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(file.buffer);
      stream
        .pipe(
          csv.parse({
            headers: true,
            trim: true,
            skipLines: 0,
          }),
        )
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', async () => {
          try {
            const result = await this.usersService.bulkImport(rows, adminId);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => {
          reject(new BadRequestException(`CSV parse error: ${err.message}`));
        });
    });
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') userId: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(userId, dto.newPassword);
  }
}

/**
 * Public endpoint for user self-query (own profile).
 * Separate from admin controller to allow any authenticated user.
 */
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersSelfController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }
}
