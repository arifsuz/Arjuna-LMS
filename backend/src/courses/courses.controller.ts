import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, EnrollStudentsDto } from './dto';
import { Roles, CurrentUser } from '../common/decorators';
import { RolesGuard } from '../common/guards';

// ─── Admin endpoints ──────────────────────────────────────────────────

@ApiTags('Admin Courses')
@ApiBearerAuth('JWT-auth')
@Controller('admin/courses')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminCoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.LECTURER)
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.LECTURER)
  async findById(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }

  @Post(':id/enroll')
  @Roles(Role.ADMIN)
  async enrollStudents(
    @Param('id') courseId: string,
    @Body() dto: EnrollStudentsDto,
  ) {
    return this.coursesService.enrollStudents(courseId, dto);
  }

  @Delete(':courseId/students/:studentId')
  @Roles(Role.ADMIN)
  async unenrollStudent(
    @Param('courseId') courseId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.coursesService.unenrollStudent(courseId, studentId);
  }
}

// ─── Authenticated user endpoints ─────────────────────────────────────

@ApiTags('Courses')
@ApiBearerAuth('JWT-auth')
@Controller('courses')
@UseGuards(AuthGuard('jwt'))
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async myCourses(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.coursesService.findByUser(userId, role);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }
}
